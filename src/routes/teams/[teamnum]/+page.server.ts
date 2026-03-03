import { getScoutingReports, getPitReports } from '$lib/server/db';

export async function load({ params }) {
	let teamnum = Number(params.teamnum);
	const pitReports = await getPitReports(teamnum);
	const matchReports = await getScoutingReports({ teamNumber: teamnum });

	return {
		teamnum,
		pitReports,
		matchReports
	};
}