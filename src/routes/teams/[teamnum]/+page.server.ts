import { getScoutingReports, getPitReports, deletePitReport, deleteScoutingReport, db } from '$lib/server/db';
import { teams, matches } from '$lib/server/db/schema';
import { eq, or, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getEpopHistory, getEpop, getEpopBeforeMatch } from '$lib/server/epop';
import { winProbability } from '$lib/winProb';

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

	// Compute per-match win probability using historically accurate ePOP snapshots.
	// Mirrors the /matches page: use getEpopBeforeMatch for qual/practice, getEpop for playoff.
	const epopSnapshots = await Promise.all(
		teamMatches.map((m) => m.matchType === 'playoff' ? getEpop() : getEpopBeforeMatch(m.matchNumber))
	);

	let hasEpopData = false;
	const matchPredictions: Record<string, number> = {};

	for (let i = 0; i < teamMatches.length; i++) {
		const match = teamMatches[i];
		const epopMap = epopSnapshots[i];
		if (epopMap.size > 0) hasEpopData = true;

		const getE = (t: number | null) => (t != null ? epopMap.get(t) ?? 0 : 0);
		const onRed = [match.red1, match.red2, match.red3].includes(teamnum);
		const myEpop = onRed
			? getE(match.red1) + getE(match.red2) + getE(match.red3)
			: getE(match.blue1) + getE(match.blue2) + getE(match.blue3);
		const theirEpop = onRed
			? getE(match.blue1) + getE(match.blue2) + getE(match.blue3)
			: getE(match.red1) + getE(match.red2) + getE(match.red3);

		matchPredictions[match.id] = winProbability(myEpop, theirEpop);
	}

	const epop = epopHistory.length > 0 ? epopHistory[epopHistory.length - 1].epop : null;

	return {
		teamnum,
		team: team ?? null,
		pitReports: pitReports ?? [],
		matchReports: matchReports ?? [],
		teamMatches: teamMatches ?? [],
		epop,
		epopHistory,
		matchPredictions,
		hasEpopData,
		isAdmin: locals.admin,
		isPrivileged: locals.privileged
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
