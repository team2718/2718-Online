import { eq, and } from 'drizzle-orm';
import { admin_sessions, scoutingReports, pitScoutingReports, eventSettings, matches, teams, matchesToTeams } from './schema';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { DATABASE_URL, ADMIN_SESSION_EXPIRY_HOURS } from '../config';

const client = createClient({ url: DATABASE_URL });
export const db = drizzle(client, { schema });

// --- Auth Functions ---

export function saveAdminSessionKey(sessionToken: string) {
	return db.insert(schema.admin_sessions).values({ cookieId: sessionToken }).run();
}

export async function checkAdminSessionKey(sessionId: string): Promise<boolean> {
	if (!sessionId) return false;

	const session = await db
		.select()
		.from(admin_sessions)
		.where(eq(admin_sessions.cookieId, sessionId))
		.get();

	if (session) {
		const now = Math.floor(Date.now() / 1000);
		if (session.createdAt == null || now - session.createdAt > 60 * 60 * ADMIN_SESSION_EXPIRY_HOURS) {
			await db.delete(admin_sessions).where(eq(admin_sessions.cookieId, sessionId)).run();
			return false;
		}
		return true;
	}
	return false;
}

// --- Scouting Report Functions ---

/**
 * Add a new match scouting report
 */
export async function addScoutingReport(report: typeof scoutingReports.$inferInsert) {
	return await db.insert(scoutingReports).values(report).run();
}

/**
 * Retrieve match reports with optional filters
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
 * Add a new pit scouting report
 */
export async function addPitReport(report: typeof pitScoutingReports.$inferInsert) {
	return await db.insert(pitScoutingReports).values(report).run();
}

/**
 * Retrieve pit reports by team or all
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
 * Delete a match scouting report by ID
 */
export async function deleteScoutingReport(id: number) {
	return await db.delete(scoutingReports).where(eq(scoutingReports.id, id)).run();
}

/**
 * Delete a pit scouting report by ID
 */
export async function deletePitReport(id: number) {
	return await db.delete(pitScoutingReports).where(eq(pitScoutingReports.id, id)).run();
}

/**
 * Delete a match and its associated scouting reports and team-junction rows
 */
export async function deleteMatch(id: string) {
	await db.delete(scoutingReports).where(eq(scoutingReports.matchId, id)).run();
	await db.delete(matchesToTeams).where(eq(matchesToTeams.matchId, id)).run();
	await db.delete(matches).where(eq(matches.id, id)).run();
}

// --- Event Settings Functions ---

export async function getEventSetting(key: string): Promise<string | null> {
	const row = await db
		.select()
		.from(eventSettings)
		.where(eq(eventSettings.key, key))
		.get();
	return row?.value ?? null;
}

export async function setEventSetting(key: string, value: string): Promise<void> {
	await db
		.insert(eventSettings)
		.values({ key, value })
		.onConflictDoUpdate({ target: eventSettings.key, set: { value } })
		.run();
}

// --- TBA Types ---

interface TBATeamSimple {
	key: string;
	team_number: number;
	nickname: string;
	name: string;
	city: string | null;
	state_prov: string | null;
	country: string | null;
}

interface TBAOprs {
	oprs: Record<string, number>;
	dprs: Record<string, number>;
	ccwms: Record<string, number>;
}

interface TBARankings {
	rankings: Array<{
		team_key: string;
		rank: number;
		sort_orders: number[];
	}>;
}

type TBACOPRs = Record<string, Record<string, number>>;

interface TBAMatchSimple {
	key: string;
	comp_level: string; // 'qm' | 'pr' | 'ef' | 'qf' | 'sf' | 'f'
	set_number: number;
	match_number: number;
	alliances: {
		red: { team_keys: string[]; score: number };
		blue: { team_keys: string[]; score: number };
	};
	event_key: string;
	time: number | null;
}

function compLevelToMatchType(compLevel: string): string {
	if (compLevel === 'pr') return 'practice';
	if (compLevel === 'qm') return 'qualification';
	return 'playoff';
}

/** Convert a TBA team key like "frc2718" to a team number */
function tbaTeamKeyToNumber(key: string): number {
	return parseInt(key.replace('frc', ''), 10);
}

/** Build our local match ID from a TBA match (e.g. "qm1", "pr1", "sf1m2") */
function tbaMatchToLocalId(m: TBAMatchSimple): string {
	if (m.comp_level === 'qm' || m.comp_level === 'pr') {
		return `${m.comp_level}${m.match_number}`;
	}
	// Playoff: include set number to disambiguate (e.g. sf1m1, qf2m1)
	return `${m.comp_level}${m.set_number}m${m.match_number}`;
}

/**
 * Fetch teams and matches from The Blue Alliance for a given event key,
 * then upsert them into the local database.
 * Returns a summary of what was inserted/updated.
 */
export async function importFromTBA(eventKey: string, apiKey: string, skipMatches = false): Promise<{
	teamsInserted: number;
	matchesInserted: number;
	matchesSkipped: boolean;
	errors: string[];
}> {
	const errors: string[] = [];
	let teamsInserted = 0;
	let matchesInserted = 0;

	const headers = { 'X-TBA-Auth-Key': apiKey };

	// -- Fetch teams --
	let tbaTeams: TBATeamSimple[] = [];
	try {
		const res = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}/teams/simple`, { headers });
		if (!res.ok) throw new Error(`TBA teams API returned ${res.status}: ${await res.text()}`);
		tbaTeams = await res.json();
	} catch (e) {
		errors.push(`Failed to fetch teams: ${String(e)}`);
	}

	// -- Fetch OPR data --
	let oprData: TBAOprs | null = null;
	try {
		const res = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}/oprs`, { headers });
		if (res.ok) {
			oprData = await res.json();
		} else if (res.status !== 404) {
			errors.push(`TBA OPRs API returned ${res.status}`);
		}
	} catch (e) {
		errors.push(`Failed to fetch OPR data: ${String(e)}`);
	}

	// -- Fetch rankings --
	let rankingsData: TBARankings | null = null;
	try {
		const res = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}/rankings`, { headers });
		if (res.ok) {
			rankingsData = await res.json();
		} else if (res.status !== 404) {
			errors.push(`TBA rankings API returned ${res.status}`);
		}
	} catch (e) {
		errors.push(`Failed to fetch rankings data: ${String(e)}`);
	}

	// -- Fetch COPRs --
	let coprsData: TBACOPRs | null = null;
	try {
		const res = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}/coprs`, { headers });
		if (res.ok) {
			coprsData = await res.json();
		} else if (res.status !== 404) {
			errors.push(`TBA COPRs API returned ${res.status}`);
		}
	} catch (e) {
		errors.push(`Failed to fetch COPRs data: ${String(e)}`);
	}

	// Build a ranking score lookup by team key
	const rankingScoreByTeam: Record<string, number> = {};
	if (rankingsData?.rankings) {
		for (const r of rankingsData.rankings) {
			if (r.sort_orders && r.sort_orders.length > 0) {
				rankingScoreByTeam[r.team_key] = r.sort_orders[0];
			}
		}
	}

	for (const t of tbaTeams) {
		try {
			const tbaKey = `frc${t.team_number}`;
			const metadata: Record<string, unknown> = {
				...(t as unknown as Record<string, unknown>),
				...(oprData
					? {
							opr: oprData.oprs?.[tbaKey] ?? null,
							dpr: oprData.dprs?.[tbaKey] ?? null,
							ccwm: oprData.ccwms?.[tbaKey] ?? null
						}
					: {}),
				ranking_score: rankingScoreByTeam[tbaKey] ?? null,
				hub_total_fuel_count_copr: coprsData?.['Hub Total Fuel Count']?.[tbaKey] ?? null
			};
			await db
				.insert(teams)
				.values({
					number: t.team_number,
					name: t.nickname ?? t.name ?? `Team ${t.team_number}`,
					metadata
				})
				.onConflictDoUpdate({
					target: teams.number,
					set: {
						name: t.nickname ?? t.name ?? `Team ${t.team_number}`,
						metadata
					}
				})
				.run();
			teamsInserted++;
		} catch (e) {
			errors.push(`Failed to upsert team ${t.team_number}: ${String(e)}`);
		}
	}

	// -- Fetch and upsert matches (skipped in practice mode since TBA has no practice matches) --
	if (!skipMatches) {
		let tbaMatches: TBAMatchSimple[] = [];
		try {
			const res = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}/matches/simple`, { headers });
			if (res.ok) {
				tbaMatches = await res.json();
			} else if (res.status !== 404) {
				errors.push(`TBA matches API returned ${res.status}`);
			}
			// 404 = no matches posted yet, silently skip
		} catch (e) {
			errors.push(`Failed to fetch matches: ${String(e)}`);
		}

		for (const m of tbaMatches) {
			try {
				const localId = tbaMatchToLocalId(m);
				const matchType = compLevelToMatchType(m.comp_level);
				const [red1, red2, red3] = m.alliances.red.team_keys.map(tbaTeamKeyToNumber);
				const [blue1, blue2, blue3] = m.alliances.blue.team_keys.map(tbaTeamKeyToNumber);

				const redScore = m.alliances.red.score >= 0 ? m.alliances.red.score : null;
				const blueScore = m.alliances.blue.score >= 0 ? m.alliances.blue.score : null;

				await db
					.insert(matches)
					.values({
						id: localId,
						matchNumber: m.match_number,
						matchType,
						red1: red1 ?? null,
						red2: red2 ?? null,
						red3: red3 ?? null,
						blue1: blue1 ?? null,
						blue2: blue2 ?? null,
						blue3: blue3 ?? null,
						redScore,
						blueScore
					})
					.onConflictDoUpdate({
						target: matches.id,
						set: { matchType, red1: red1 ?? null, red2: red2 ?? null, red3: red3 ?? null, blue1: blue1 ?? null, blue2: blue2 ?? null, blue3: blue3 ?? null, redScore, blueScore }
					})
					.run();

				// Keep matchesToTeams junction table in sync
				const stationEntries: { matchId: string; teamNumber: number; station: string }[] = [
					...(red1 ? [{ matchId: localId, teamNumber: red1, station: 'red1' }] : []),
					...(red2 ? [{ matchId: localId, teamNumber: red2, station: 'red2' }] : []),
					...(red3 ? [{ matchId: localId, teamNumber: red3, station: 'red3' }] : []),
					...(blue1 ? [{ matchId: localId, teamNumber: blue1, station: 'blue1' }] : []),
					...(blue2 ? [{ matchId: localId, teamNumber: blue2, station: 'blue2' }] : []),
					...(blue3 ? [{ matchId: localId, teamNumber: blue3, station: 'blue3' }] : [])
				];

				for (const entry of stationEntries) {
					await db
						.insert(matchesToTeams)
						.values(entry)
						.onConflictDoUpdate({
							target: [matchesToTeams.matchId, matchesToTeams.teamNumber],
							set: { station: entry.station }
						})
						.run();
				}

				matchesInserted++;
			} catch (e) {
				errors.push(`Failed to upsert match ${m.key}: ${String(e)}`);
			}
		}
	}

	return { teamsInserted, matchesInserted, matchesSkipped: skipMatches, errors };
}

/**
 * Given a raw match number from a scanned QR code, build the local match ID
 * based on the current defaultMatchType setting.
 */
export async function getMatchIdForScan(matchNumber: number): Promise<string> {
	const matchType = await getEventSetting('defaultMatchType');
	if (matchType === 'qualification') return `qm${matchNumber}`;
	if (matchType === 'practice') return `pr${matchNumber}`;
	// Fallback: legacy bare number string
	return String(matchNumber);
}
