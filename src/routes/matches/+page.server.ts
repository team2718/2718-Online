// src/routes/matches/+page.server.ts
import { db, getScoutingReports } from '$lib/server/db';
import { matches } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // Fetch all matches directly from the table
    const allMatches = await db.select().from(matches).all();
    
    // Use the existing DB utility to fetch all scouting reports
    const allReports = await getScoutingReports();

    return { 
        matches: allMatches,
        reports: allReports
    };
};