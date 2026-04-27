import { getScoutingReports, deleteScoutingReport, db } from '$lib/server/db';
import { matches } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
    const [reports, match] = await Promise.all([
        getScoutingReports({ matchId: params.matchId }),
        db.select().from(matches).where(eq(matches.id, params.matchId)).get()
    ]);

    return {
        matchId: params.matchId,
        match: match ?? null,
        reports,
        isAdmin: locals.admin,
        isPrivileged: locals.privileged
    };
};

export const actions: Actions = {
    deleteReport: async ({ request, locals }) => {
        if (!locals.admin) {
            return fail(401, { error: 'Unauthorized' });
        }
        const data = await request.formData();
        const id = data.get('id');

        if (typeof id !== 'string') {
            return fail(400, { error: 'Invalid ID' });
        }

        await deleteScoutingReport(parseInt(id));
        return { success: true };
    }
};
