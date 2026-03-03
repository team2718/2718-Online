import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getScoutingReports } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const { matchId, teamNumber } = params;

	const reports = await getScoutingReports({ 
		matchId, 
		teamNumber: Number(teamNumber) 
	});

	if (!reports || reports.length === 0) {
		throw error(404, 'Report not found');
	}

	return {
		report: reports[0]
	};
};