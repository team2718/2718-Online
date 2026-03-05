import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { addPitReport, db } from '$lib/server/db';
import { teams } from '$lib/server/db/schema';

export const load: PageServerLoad = ({ url }) => {
	return { prefillTeam: url.searchParams.get('team') ?? '' };
};

export const actions: Actions = {
	submit: async ({ request }) => {
		const formData = await request.formData();
		const rawData = formData.get('data') as string;

		if (!rawData) return fail(400, { message: 'No data received' });

		try {
			const parsed = JSON.parse(rawData);

			if (!parsed.teamNumber || !parsed.scoutName) {
				return fail(400, { message: 'Team number and scouter name are required' });
			}

			const teamNum = Number(parsed.teamNumber);

			// Ensure Team exists
			await db.insert(teams)
				.values({ number: teamNum, name: `Team ${teamNum}` })
				.onConflictDoNothing()
				.run();

			await addPitReport({
				teamNumber: teamNum,
				scouterName: parsed.scoutName,
				data: parsed
			});

			return { success: true };
		} catch (err) {
			console.error("Pit scouting upload error:", err);
			return fail(500, { message: 'Failed to save pit report' });
		}
	}
};
