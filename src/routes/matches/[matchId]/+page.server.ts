import { getScoutingReports } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const reports = await getScoutingReports({ matchId: params.matchId });
    return {
        matchId: params.matchId,
        reports
    };
};