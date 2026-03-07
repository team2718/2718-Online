import { db } from '$lib/server/db';
import { scoutingReports, teams, matchesToTeams, matches } from '$lib/server/db/schema';
import { eq, isNull, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [allReports, ghostTeams] = await Promise.all([
		db
			.select({
				id: scoutingReports.id,
				matchId: scoutingReports.matchId,
				teamNumber: scoutingReports.teamNumber,
				scouterName: scoutingReports.scouterName,
				createdAt: scoutingReports.createdAt,
				teamName: teams.name,
				teamMetadata: teams.metadata
			})
			.from(scoutingReports)
			.leftJoin(teams, eq(scoutingReports.teamNumber, teams.number))
			.leftJoin(matches, eq(scoutingReports.matchId, matches.id))
			.orderBy(asc(matches.matchType), asc(matches.matchNumber), asc(scoutingReports.teamNumber))
			.all(),
		db
			.select({ number: teams.number, name: teams.name })
			.from(teams)
			.where(isNull(teams.metadata))
			.all()
	]);

	const ghostTeamNums = new Set(ghostTeams.map((t) => t.number));
	const reportCountByTeam = new Map<number, number>();
	for (const r of allReports) {
		if (ghostTeamNums.has(r.teamNumber)) {
			reportCountByTeam.set(r.teamNumber, (reportCountByTeam.get(r.teamNumber) ?? 0) + 1);
		}
	}

	return {
		reports: allReports.map((r) => ({
			...r,
			isGhost: ghostTeamNums.has(r.teamNumber)
		})),
		ghostTeams: ghostTeams.map((t) => ({
			...t,
			reportCount: reportCountByTeam.get(t.number) ?? 0
		}))
	};
};

export const actions: Actions = {
	fixReport: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		const newTeamRaw = formData.get('newTeam');

		if (typeof id !== 'string') return fail(400, { error: 'Missing report ID' });
		const reportId = parseInt(id, 10);
		const newTeam = parseInt(String(newTeamRaw), 10);
		if (isNaN(newTeam) || newTeam <= 0) return fail(400, { error: 'Invalid team number' });

		const report = await db
			.select()
			.from(scoutingReports)
			.where(eq(scoutingReports.id, reportId))
			.get();
		if (!report) return fail(404, { error: 'Report not found' });

		// Ensure the target team row exists
		await db
			.insert(teams)
			.values({ number: newTeam, name: `Team ${newTeam}` })
			.onConflictDoNothing()
			.run();

		// Update both the column and the JSON data field
		const newData = report.data ? { ...report.data, teamNumber: newTeam } : report.data;
		await db
			.update(scoutingReports)
			.set({ teamNumber: newTeam, data: newData as typeof report.data })
			.where(eq(scoutingReports.id, reportId))
			.run();

		return { success: true, action: 'fixReport' };
	},

	deleteReport: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		if (typeof id !== 'string') return fail(400, { error: 'Invalid ID' });
		await db.delete(scoutingReports).where(eq(scoutingReports.id, parseInt(id, 10))).run();
		return { success: true, action: 'deleteReport' };
	},

	deleteGhostTeam: async ({ request }) => {
		const formData = await request.formData();
		const num = formData.get('number');
		if (typeof num !== 'string') return fail(400, { error: 'Invalid team number' });
		const teamNum = parseInt(num, 10);

		const team = await db.select().from(teams).where(eq(teams.number, teamNum)).get();
		if (!team) return fail(404, { error: 'Team not found' });
		if (team.metadata != null) return fail(400, { error: 'Cannot delete a team with TBA metadata' });

		const remaining = await db
			.select({ id: scoutingReports.id })
			.from(scoutingReports)
			.where(eq(scoutingReports.teamNumber, teamNum))
			.all();

		if (remaining.length > 0) {
			return fail(400, {
				error: `Team ${teamNum} still has ${remaining.length} report(s). Fix or delete those first.`,
				action: 'deleteGhostTeam'
			});
		}

		await db.delete(matchesToTeams).where(eq(matchesToTeams.teamNumber, teamNum)).run();
		await db.delete(teams).where(eq(teams.number, teamNum)).run();

		return { success: true, action: 'deleteGhostTeam', teamNum };
	}
};
