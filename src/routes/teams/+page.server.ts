import { db } from '$lib/server/db';
import { scoutingReports, pitScoutingReports } from '$lib/server/db/schema';

export async function load() {
	// Aggregate distinct team numbers from both sets of reports
    const matchTeams = await db.select({ teamNumber: scoutingReports.teamNumber }).from(scoutingReports);
    const pitTeams = await db.select({ teamNumber: pitScoutingReports.teamNumber }).from(pitScoutingReports);
    
    const uniqueTeams = new Set([
		...matchTeams.map(r => r.teamNumber), 
		...pitTeams.map(r => r.teamNumber)
	]);
    
    return {
        teams: Array.from(uniqueTeams).sort((a, b) => a - b)
    };
}