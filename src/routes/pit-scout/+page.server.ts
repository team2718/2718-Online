import { db } from '$lib/server/db';
import { teams, pitScoutingReports } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

export async function load() {
	const [allTeams, allPitReports] = await Promise.all([
		db.select().from(teams).orderBy(asc(teams.number)).all(),
		db.select({ teamNumber: pitScoutingReports.teamNumber }).from(pitScoutingReports).all()
	]);

	const scoutedTeamNums = new Set(allPitReports.map((r) => r.teamNumber));

	return {
		teams: allTeams.map((t) => ({ ...t, pitScouted: scoutedTeamNums.has(t.number) }))
	};
}
