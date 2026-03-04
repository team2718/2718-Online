import { getScoutingReports, getPitReports, deletePitReport, deleteScoutingReport } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export async function load({ params, locals }) {
	const teamnum = Number(params.teamnum);
	
	// Fetch data from database
	const pitReports = await getPitReports(teamnum);
	const matchReports = await getScoutingReports({ teamNumber: teamnum });

	return {
		teamnum,
		// Ensure fallback to empty arrays to prevent frontend 'map' errors
		pitReports: pitReports ?? [],
		matchReports: matchReports ?? [],
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
        
        if (typeof id !== 'string') {
            return fail(400, { error: 'Invalid ID' });
        }
        
        await deletePitReport(parseInt(id));
        return { success: true };
    }
};