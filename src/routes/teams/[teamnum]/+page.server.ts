import { getScoutingReports, getPitReports } from '$lib/server/db';

export async function load({ params }) {
	const teamnum = Number(params.teamnum);
	
	// Fetch data from database
	const pitReports = await getPitReports(teamnum);
	const matchReports = await getScoutingReports({ teamNumber: teamnum });

	return {
		teamnum,
		// Ensure fallback to empty arrays to prevent frontend 'map' errors
		pitReports: pitReports ?? [],
		matchReports: matchReports ?? []
	};
}