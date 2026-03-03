import { fail, type Actions } from '@sveltejs/kit';
import { addScoutingReport, db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { scoutingReports, teams, matches } from '$lib/server/db/schema';

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
			
			const uid = !isNaN(Number(parsed.uid)) ? Number(parsed.uid) : Math.floor(Math.random() * 100000000);
			const teamNum = Number(parsed.teamNumber);
			const matchNumStr = String(parsed.matchNumber);

			// 1. Check for duplicates
			const existingReport = await db.query.scoutingReports.findFirst({
				where: eq(scoutingReports.id, uid)
			});

			if (existingReport) {
				return fail(409, { message: 'This report has already been scanned!' });
			}

			// 2. Ensure Team exists
			await db.insert(teams)
				.values({ number: teamNum, name: `Team ${teamNum}` })
				.onConflictDoNothing()
				.run();

			// 3. Ensure Match exists (Simplified: No event reference needed)
			await db.insert(matches)
				.values({
					id: matchNumStr,
					matchNumber: Number(parsed.matchNumber)
				})
				.onConflictDoNothing()
				.run();

			// 4. Save report
			await addScoutingReport({
				id: uid,
				matchId: matchNumStr,
				teamNumber: teamNum,
				scouterName: parsed.scoutName || 'Unknown',
				data: parsed
			});

			return { success: true };
		} catch (err) {
			console.error("Scan error:", err);
			return fail(500, { message: 'Failed to save report' });
		}
	}
};