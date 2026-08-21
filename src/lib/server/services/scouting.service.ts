import { and, eq, notInArray, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { matches, pitScoutingReports, scoutingReports, teams } from '$lib/server/db/schema';
import type { PitScoutReportData, ScoutingReportData, MatchType } from '$lib/types';
import { invalidateEpopCache } from '$lib/server/epop';

export interface RecordScoutingResult {
	success: boolean;
	matchId?: string;
	matchType?: string;
	duplicate?: boolean;
	error?: string;
}

/**
 * Atomically records a match scouting report from QR code data.
 * Ensures the team and match exist, handles practice match slots safely in a transaction,
 * and invalidates the ePOP cache.
 */
export async function recordScoutingReport(
	reportData: ScoutingReportData,
	defaultMatchType: MatchType = 'qualification'
): Promise<RecordScoutingResult> {
	const uid = reportData.uid;
	const teamNum = Number(reportData.teamNumber);
	const matchNum = Number(reportData.matchNumber);

	let matchType: MatchType = defaultMatchType;
	let matchId: string;
	if (matchType === 'practice') {
		matchId = `pr${matchNum}`;
	} else {
		matchType = 'qualification';
		matchId = `qm${matchNum}`;
	}

	try {
		const isDuplicate = await db.transaction(async (tx) => {
			// 1. Check duplicate UID
			const existing = await tx
				.select({ id: scoutingReports.id })
				.from(scoutingReports)
				.where(eq(scoutingReports.id, uid))
				.get();

			if (existing) {
				return true;
			}

			// 2. Ensure Team exists
			await tx
				.insert(teams)
				.values({ number: teamNum, name: `Team ${teamNum}` })
				.onConflictDoNothing()
				.run();

			// 3. Ensure Match exists / populate practice slot
			if (matchType === 'practice') {
				const existingMatch = await tx.select().from(matches).where(eq(matches.id, matchId)).get();

				if (!existingMatch) {
					await tx
						.insert(matches)
						.values({
							id: matchId,
							matchNumber: matchNum,
							matchType,
							red1: reportData.alliance === 0 ? teamNum : null,
							red2: null,
							red3: null,
							blue1: reportData.alliance === 1 ? teamNum : null,
							blue2: null,
							blue3: null
						})
						.run();
				} else {
					if (reportData.alliance === 0) {
						if (
							!existingMatch.red1 &&
							existingMatch.red2 !== teamNum &&
							existingMatch.red3 !== teamNum
						) {
							await tx.update(matches).set({ red1: teamNum }).where(eq(matches.id, matchId)).run();
						} else if (
							!existingMatch.red2 &&
							existingMatch.red1 !== teamNum &&
							existingMatch.red3 !== teamNum
						) {
							await tx.update(matches).set({ red2: teamNum }).where(eq(matches.id, matchId)).run();
						} else if (
							!existingMatch.red3 &&
							existingMatch.red1 !== teamNum &&
							existingMatch.red2 !== teamNum
						) {
							await tx.update(matches).set({ red3: teamNum }).where(eq(matches.id, matchId)).run();
						}
					} else {
						if (
							!existingMatch.blue1 &&
							existingMatch.blue2 !== teamNum &&
							existingMatch.blue3 !== teamNum
						) {
							await tx.update(matches).set({ blue1: teamNum }).where(eq(matches.id, matchId)).run();
						} else if (
							!existingMatch.blue2 &&
							existingMatch.blue1 !== teamNum &&
							existingMatch.blue3 !== teamNum
						) {
							await tx.update(matches).set({ blue2: teamNum }).where(eq(matches.id, matchId)).run();
						} else if (
							!existingMatch.blue3 &&
							existingMatch.blue1 !== teamNum &&
							existingMatch.blue2 !== teamNum
						) {
							await tx.update(matches).set({ blue3: teamNum }).where(eq(matches.id, matchId)).run();
						}
					}
				}
			} else {
				await tx
					.insert(matches)
					.values({ id: matchId, matchNumber: matchNum, matchType })
					.onConflictDoNothing()
					.run();
			}

			// 4. Insert report
			await tx
				.insert(scoutingReports)
				.values({
					id: uid,
					matchId,
					teamNumber: teamNum,
					scouterName: reportData.scoutName || 'Unknown',
					data: reportData
				})
				.run();

			return false;
		});

		if (isDuplicate) {
			return { success: false, duplicate: true, error: 'This report has already been scanned!' };
		}

		invalidateEpopCache();
		return { success: true, matchId, matchType };
	} catch (err) {
		console.error('[Scouting] Failed to record report:', err);
		return { success: false, error: 'Database error saving report' };
	}
}

/**
 * Atomically records a pit scouting report.
 */
export async function recordPitReport(
	reportData: PitScoutReportData
): Promise<{ success: boolean; error?: string }> {
	const teamNum = Number(reportData.teamNumber);
	if (isNaN(teamNum) || teamNum <= 0) {
		return { success: false, error: 'Invalid team number' };
	}

	try {
		await db.transaction(async (tx) => {
			await tx
				.insert(teams)
				.values({ number: teamNum, name: `Team ${teamNum}` })
				.onConflictDoNothing()
				.run();

			await tx
				.insert(pitScoutingReports)
				.values({
					teamNumber: teamNum,
					scouterName: reportData.scoutName || 'Unknown',
					data: reportData
				})
				.run();
		});

		return { success: true };
	} catch (err) {
		console.error('[Pit Scouting] Failed to record report:', err);
		return { success: false, error: 'Database error saving pit report' };
	}
}

/**
 * Retrieves match scouting reports with optional filters.
 */
export async function getScoutingReports(filters?: { matchId?: string; teamNumber?: number }) {
	if (filters?.matchId && filters?.teamNumber) {
		return await db.query.scoutingReports.findMany({
			where: and(
				eq(scoutingReports.matchId, filters.matchId),
				eq(scoutingReports.teamNumber, filters.teamNumber)
			)
		});
	} else if (filters?.matchId) {
		return await db.query.scoutingReports.findMany({
			where: eq(scoutingReports.matchId, filters.matchId)
		});
	} else if (filters?.teamNumber) {
		return await db.query.scoutingReports.findMany({
			where: eq(scoutingReports.teamNumber, filters.teamNumber)
		});
	}
	return await db.query.scoutingReports.findMany();
}

/**
 * Retrieves pit scouting reports by team or all.
 */
export async function getPitReports(teamNumber?: number) {
	if (teamNumber) {
		return await db.query.pitScoutingReports.findMany({
			where: eq(pitScoutingReports.teamNumber, teamNumber)
		});
	}
	return await db.query.pitScoutingReports.findMany();
}

/**
 * Deletes a match scouting report by ID.
 */
export async function deleteScoutingReport(id: number): Promise<void> {
	await db.delete(scoutingReports).where(eq(scoutingReports.id, id)).run();
	invalidateEpopCache();
}

/**
 * Deletes a pit scouting report by ID.
 */
export async function deletePitReport(id: number): Promise<void> {
	await db.delete(pitScoutingReports).where(eq(pitScoutingReports.id, id)).run();
}

/**
 * Deletes a match and its associated scouting reports.
 */
export async function deleteMatch(id: string): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.delete(scoutingReports).where(eq(scoutingReports.matchId, id)).run();
		await tx.delete(matches).where(eq(matches.id, id)).run();
	});
	invalidateEpopCache();
}

/**
 * Removes orphaned matches and teams that have no associated reports.
 */
export async function cleanupDatabase(): Promise<{
	deletedMatches: string[];
	deletedTeams: number[];
}> {
	const [allMatches, allReports, allTeams, allPitReports] = await Promise.all([
		db.select({ id: matches.id }).from(matches).all(),
		db
			.select({ matchId: scoutingReports.matchId, teamNumber: scoutingReports.teamNumber })
			.from(scoutingReports)
			.all(),
		db.select({ number: teams.number, metadata: teams.metadata }).from(teams).all(),
		db.select({ teamNumber: pitScoutingReports.teamNumber }).from(pitScoutingReports).all()
	]);

	const matchIdsWithReports = new Set(allReports.map((r) => r.matchId));
	const teamNumsWithReports = new Set([
		...allReports.map((r) => r.teamNumber),
		...allPitReports.map((r) => r.teamNumber)
	]);

	const orphanMatches = allMatches.filter((m) => !matchIdsWithReports.has(m.id)).map((m) => m.id);
	// Only delete ghost teams that have no metadata (not from TBA) and no reports
	const orphanTeams = allTeams
		.filter((t) => t.metadata == null && !teamNumsWithReports.has(t.number))
		.map((t) => t.number);

	await db.transaction(async (tx) => {
		for (const mid of orphanMatches) {
			await tx.delete(matches).where(eq(matches.id, mid)).run();
		}
		for (const tnum of orphanTeams) {
			await tx.delete(teams).where(eq(teams.number, tnum)).run();
		}
	});

	invalidateEpopCache();
	return { deletedMatches: orphanMatches, deletedTeams: orphanTeams };
}

/**
 * Permanently wipes all matches, teams, and scouting reports.
 */
export async function wipeDatabase(): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.delete(scoutingReports).run();
		await tx.delete(pitScoutingReports).run();
		await tx.delete(matches).run();
		await tx.delete(teams).run();
	});
	invalidateEpopCache();
}
