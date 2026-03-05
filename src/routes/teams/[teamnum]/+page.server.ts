import { getScoutingReports, getPitReports, deletePitReport, deleteScoutingReport, db } from '$lib/server/db';
import { teams } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export async function load({ params, locals }) {
	const teamnum = Number(params.teamnum);

	const [team, pitReports, matchReports] = await Promise.all([
		db.select().from(teams).where(eq(teams.number, teamnum)).get(),
		getPitReports(teamnum),
		getScoutingReports({ teamNumber: teamnum })
	]);

	return {
		teamnum,
		team: team ?? null,
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