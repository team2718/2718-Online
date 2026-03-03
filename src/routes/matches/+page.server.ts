import { db } from '$lib/server/db';
import { matches } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const allMatches = await db.select().from(matches).all();
    return { matches: allMatches };
};