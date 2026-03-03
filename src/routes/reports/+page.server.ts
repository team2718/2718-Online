import type { PageServerLoad } from './$types';
import { getScoutingReports } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const reports = await getScoutingReports();
	return {
		reports
	};
};