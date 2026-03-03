import { fail, type Actions } from '@sveltejs/kit';
import { addScoutingReport } from '$lib/server/db'; // Adjust path to your index.ts

export const actions: Actions = {
	submitScan: async ({ request }) => {
		const formData = await request.formData();
		const rawData = formData.get('report') as string;

		if (!rawData) return fail(400, { message: 'No data received' });

		try {
			const parsed = JSON.parse(rawData);
			
			// Map QR JSON to the database schema
			await addScoutingReport({
				matchId: parsed.matchId,
				teamNumber: Number(parsed.teamNumber),
				scouterName: parsed.scouterName || 'Unknown',
				data: parsed // Store the full object in the JSON column
			});

			return { success: true };
		} catch (err) {
			return fail(500, { message: 'Failed to save report' });
		}
	}
};