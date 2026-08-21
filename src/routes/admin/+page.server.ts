import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { TBA_API_KEY } from '$lib/server/config';
import { deleteSession } from '$lib/server/services/auth.service';
import {
	setEventSetting,
	getDefaultMatchType,
	getEventCode,
	isAutoTbaPullEnabled
} from '$lib/server/services/settings.service';
import { syncEventData } from '$lib/server/services/sync.service';
import { cleanupDatabase, wipeDatabase } from '$lib/server/services/scouting.service';

export const load: PageServerLoad = async () => {
	const [defaultMatchType, eventCode, autoTbaPull] = await Promise.all([
		getDefaultMatchType(),
		getEventCode(),
		isAutoTbaPullEnabled()
	]);

	return {
		defaultMatchType,
		tbaApiKeyConfigured: TBA_API_KEY.length > 0,
		eventCode: eventCode ?? '',
		autoTbaPull
	};
};

export const actions: Actions = {
	logout: async ({ cookies }) => {
		const sessionToken = cookies.get('admin-auth');
		if (sessionToken) {
			await deleteSession(sessionToken);
		}
		cookies.delete('admin-auth', { path: '/' });
		throw redirect(303, '/');
	},

	setMatchType: async ({ request }) => {
		const formData = await request.formData();
		const matchType = formData.get('matchType');

		if (matchType !== 'practice' && matchType !== 'qualification' && matchType !== 'playoff') {
			return fail(400, { message: 'Invalid match type' });
		}

		await setEventSetting('defaultMatchType', matchType);
		return { success: true, action: 'setMatchType', matchType };
	},

	fetchTBA: async ({ request }) => {
		const formData = await request.formData();
		const eventKey = (formData.get('eventKey') as string)?.trim();
		const apiKey = (formData.get('tbaApiKey') as string)?.trim() || TBA_API_KEY;

		if (!eventKey) {
			return fail(400, { message: 'Event key is required' });
		}
		if (!apiKey) {
			return fail(400, {
				message: 'TBA API key is required (set TBA_API_KEY env var or enter it below)'
			});
		}

		try {
			const matchType = await getDefaultMatchType();
			const skipMatches = matchType === 'practice';
			const result = await syncEventData(eventKey, apiKey, skipMatches);

			return {
				success: result.errors.length === 0,
				action: 'fetchTBA',
				teamsInserted: result.teamsInserted,
				matchesInserted: result.matchesInserted,
				matchesSkipped: result.matchesSkipped,
				errors: result.errors
			};
		} catch (e) {
			console.error('TBA import error:', e);
			return fail(500, { message: `TBA import failed: ${String(e)}` });
		}
	},

	setAutoTbaPull: async ({ request }) => {
		const formData = await request.formData();
		const enabled = formData.get('autoTbaPull') === 'true';
		await setEventSetting('autoTbaPull', enabled ? 'true' : 'false');
		return { success: true, action: 'setAutoTbaPull', autoTbaPull: enabled };
	},

	wipeDatabase: async () => {
		try {
			await wipeDatabase();
			return { success: true, action: 'wipe' };
		} catch (e) {
			console.error('Database wipe error:', e);
			return fail(500, { message: 'Failed to wipe database' });
		}
	},

	cleanupDatabase: async () => {
		try {
			const result = await cleanupDatabase();
			return {
				success: true,
				action: 'cleanup',
				deletedMatches: result.deletedMatches,
				deletedTeams: result.deletedTeams
			};
		} catch (e) {
			console.error('Database cleanup error:', e);
			return fail(500, { message: 'Failed to clean up database' });
		}
	}
};
