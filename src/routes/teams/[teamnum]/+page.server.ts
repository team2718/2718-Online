import { getScoutingReports, getPitReports, deletePitReport, deleteScoutingReport, db } from '$lib/server/db';
import { teams, matches } from '$lib/server/db/schema';
import { eq, or, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getEpopHistory } from '$lib/server/epop';

export async function load({ params, locals }) {
	const teamnum = Number(params.teamnum);

	const [team, pitReports, matchReports, epopHistory, teamMatches] = await Promise.all([
		db.select().from(teams).where(eq(teams.number, teamnum)).get(),
		getPitReports(teamnum),
		getScoutingReports({ teamNumber: teamnum }),
		getEpopHistory(teamnum),
		db
			.select({
				id: matches.id,
				matchNumber: matches.matchNumber,
				matchType: matches.matchType,
				red1: matches.red1, red2: matches.red2, red3: matches.red3,
				blue1: matches.blue1, blue2: matches.blue2, blue3: matches.blue3,
				redScore: matches.redScore,
				blueScore: matches.blueScore
			})
			.from(matches)
			.where(
				or(
					eq(matches.red1, teamnum), eq(matches.red2, teamnum), eq(matches.red3, teamnum),
					eq(matches.blue1, teamnum), eq(matches.blue2, teamnum), eq(matches.blue3, teamnum)
				)
			)
			.orderBy(asc(matches.matchNumber))
			.all()
	]);

	const epop = epopHistory.length > 0 ? epopHistory[epopHistory.length - 1].epop : null;

	return {
		teamnum,
		team: team ?? null,
		pitReports: pitReports ?? [],
		matchReports: matchReports ?? [],
		teamMatches: teamMatches ?? [],
		epop,
		epopHistory,
		isAdmin: locals.admin
	};
}

export const actions = {
    deletePitReport: async ({ request, locals }) => {
        if (!locals.admin) {
            return fail(401, { error: 'Unauthorized' });
        }
        const data = await request.formData();
        const id = data.get('id');
        if (typeof id !== 'string') return fail(400, { error: 'Invalid ID' });
        await deletePitReport(parseInt(id));
        return { success: true };
    },
    deleteReport: async ({ request, locals }) => {
        if (!locals.admin) {
            return fail(401, { error: 'Unauthorized' });
        }
        const data = await request.formData();
        const id = data.get('id');
        if (typeof id !== 'string') return fail(400, { error: 'Invalid ID' });
        await deleteScoutingReport(parseInt(id));
        return { success: true };
    }
};
