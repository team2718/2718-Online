import { db, getScoutingReports } from '$lib/server/db';
import { matches } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const allMatches = await db
        .select()
        .from(matches)
        .orderBy(asc(matches.matchType), asc(matches.matchNumber))
        .all();

    const allReports = await getScoutingReports();

    return {
        matches: allMatches,
        reports: allReports
    };
};
