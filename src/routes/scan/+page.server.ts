import { fail, type Actions } from '@sveltejs/kit';
import { addScoutingReport, db, getEventSetting } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { scoutingReports, teams, matches } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const matchType = (await getEventSetting('defaultMatchType')) ?? 'qualification';
	return { matchType };
};

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
			const matchNum = Number(parsed.matchNumber);

			// Derive match ID and type from today's setting in a single lookup
			const setting = await getEventSetting('defaultMatchType');
			let matchType: string;
			let matchId: string;
			if (setting === 'practice') {
				matchType = 'practice';
				matchId = `pr${matchNum}`;
			} else {
				// Default to qualification
				matchType = 'qualification';
				matchId = `qm${matchNum}`;
			}

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

			// 3. Ensure Match exists; for practice, populate alliance slots as scans arrive
			if (matchType === 'practice') {
				const existingMatch = await db.select().from(matches).where(eq(matches.id, matchId)).get();
				if (!existingMatch) {
					await db.insert(matches).values({
						id: matchId,
						matchNumber: matchNum,
						matchType,
						red1: parsed.alliance === 0 ? teamNum : null,
						red2: null,
						red3: null,
						blue1: parsed.alliance === 1 ? teamNum : null,
						blue2: null,
						blue3: null
					}).run();
				} else {
					// Fill the next available slot for this team's alliance
					if (parsed.alliance === 0) {
						if (!existingMatch.red1)      await db.update(matches).set({ red1: teamNum }).where(eq(matches.id, matchId)).run();
						else if (!existingMatch.red2) await db.update(matches).set({ red2: teamNum }).where(eq(matches.id, matchId)).run();
						else if (!existingMatch.red3) await db.update(matches).set({ red3: teamNum }).where(eq(matches.id, matchId)).run();
					} else {
						if (!existingMatch.blue1)      await db.update(matches).set({ blue1: teamNum }).where(eq(matches.id, matchId)).run();
						else if (!existingMatch.blue2) await db.update(matches).set({ blue2: teamNum }).where(eq(matches.id, matchId)).run();
						else if (!existingMatch.blue3) await db.update(matches).set({ blue3: teamNum }).where(eq(matches.id, matchId)).run();
					}
				}
			} else {
				// Qualification/playoff: preserve any TBA schedule data already present
				await db.insert(matches)
					.values({ id: matchId, matchNumber: matchNum, matchType })
					.onConflictDoNothing()
					.run();
			}

			// 4. Save report
			await addScoutingReport({
				id: uid,
				matchId,
				teamNumber: teamNum,
				scouterName: parsed.scoutName || 'Unknown',
				data: parsed
			});

			return { success: true, matchId, matchType };
		} catch (err) {
			console.error("Scan error:", err);
			return fail(500, { message: 'Failed to save report' });
		}
	}
};
