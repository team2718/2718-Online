import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDefaultMatchType } from '$lib/server/services/settings.service';
import { parseScoutingQr } from '$lib/schemas/scouting.schema';
import { recordScoutingReport } from '$lib/server/services/scouting.service';

export const load: PageServerLoad = async () => {
	const matchType = await getDefaultMatchType();
	return { matchType };
};

export const actions: Actions = {
	submitScan: async ({ request }) => {
		const formData = await request.formData();
		const rawData = formData.get('report');

		if (typeof rawData !== 'string' || !rawData.trim()) {
			return fail(400, { message: 'No QR code data received' });
		}

		// 1. Validate data using Zod schema
		const parseResult = parseScoutingQr(rawData);
		if (!parseResult.success) {
			return fail(400, { message: parseResult.error });
		}

		// 2. Fetch current match type setting and record report atomically
		const matchType = await getDefaultMatchType();
		const result = await recordScoutingReport(parseResult.data, matchType);

		if (!result.success) {
			if (result.duplicate) {
				return fail(409, { message: result.error ?? 'Duplicate report already scanned' });
			}
			return fail(500, { message: result.error ?? 'Failed to save report' });
		}

		return {
			success: true,
			matchId: result.matchId,
			matchType: result.matchType
		};
	}
};
