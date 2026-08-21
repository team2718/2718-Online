import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { parsePitReport } from '$lib/schemas/pit.schema';
import { recordPitReport } from '$lib/server/services/scouting.service';

export const load: PageServerLoad = ({ url }) => {
	return { prefillTeam: url.searchParams.get('team') ?? '' };
};

export const actions: Actions = {
	submit: async ({ request }) => {
		const formData = await request.formData();
		const rawData = formData.get('data');

		if (typeof rawData !== 'string' || !rawData.trim()) {
			return fail(400, { message: 'No pit scouting data received' });
		}

		// 1. Validate data using Zod schema
		const parseResult = parsePitReport(rawData);
		if (!parseResult.success) {
			return fail(400, { message: parseResult.error });
		}

		// 2. Record pit report atomically
		const result = await recordPitReport(parseResult.data);
		if (!result.success) {
			return fail(500, { message: result.error ?? 'Failed to save pit report' });
		}

		return { success: true };
	}
};
