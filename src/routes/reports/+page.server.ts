import { db, getScoutingReports, deleteMatch } from '$lib/server/db';
import { matches } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const allMatches = await db
        .select()
        .from(matches)
        .orderBy(asc(matches.matchType), asc(matches.matchNumber))
        .all();

    const allReports = await getScoutingReports();

    return {
        matches: allMatches,
        reports: allReports,
        isAdmin: locals.admin
    };
};

export const actions: Actions = {
    deleteMatch: async ({ request, locals }) => {
        if (!locals.admin) {
            return fail(401, { error: 'Unauthorized' });
        }
        const data = await request.formData();
        const id = data.get('id');

        if (typeof id !== 'string') {
            return fail(400, { error: 'Invalid ID' });
        }

        await deleteMatch(id);
        return { success: true };
    }
};
