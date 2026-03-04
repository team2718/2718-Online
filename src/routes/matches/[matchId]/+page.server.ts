import { getScoutingReports, deleteScoutingReport } from '$lib/server/db';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
    const reports = await getScoutingReports({ matchId: params.matchId });
    return {
        matchId: params.matchId,
        reports,
        isAdmin: locals.admin
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