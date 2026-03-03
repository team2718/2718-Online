import { fail, type Actions } from '@sveltejs/kit';
import { addScoutingReport } from '$lib/server/db'; // Adjust path to your index.ts

export const actions: Actions = {
	submitScan: async ({ request }) => {
		const formData = await request.formData();
		const rawData = formData.get('report') as string;

		if (!rawData) return fail(400, { message: 'No data received' });

		try {
			const parsed = JSON.parse(rawData);

			if (!parsed.uid || !parsed.matchNumber || !parsed.teamNumber) {
				return fail(400, { message: 'Invalid data format' });
			}

			if (parsed.stagesComplete < 4) {
				return fail(400, { message: 'Report is incomplete' });
			}
			
			// Map QR JSON to the database schema
			await addScoutingReport({
				id: parsed.uid,
				matchId: parsed.matchNumber,
				teamNumber: Number(parsed.teamNumber),
				scouterName: parsed.scoutName || 'Unknown',
				data: parsed // Store the full object in the JSON column
			});

			return { success: true };
		} catch (err) {
			return fail(500, { message: 'Failed to save report' });
		}
	}
};