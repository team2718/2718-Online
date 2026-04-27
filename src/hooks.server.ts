// src/hooks.server.ts

import type { Handle } from '@sveltejs/kit';
import schedule from 'node-schedule';
import { checkSessionLevel, getEventSetting, importFromTBA } from '$lib/server/db';
import { runBackup } from '$lib/server/backup';
import { TBA_API_KEY } from '$lib/server/config';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('admin-auth');
	let level: 'admin' | 'privileged' | null = null;
	if (sessionId) {
		level = await checkSessionLevel(sessionId);
		if (!level) {
			event.cookies.delete('admin-auth', { path: '/' });
		}
	}
	event.locals.admin = level === 'admin';
	event.locals.privileged = level === 'admin' || level === 'privileged';
	return resolve(event);
};

// Use global variables to persist jobs across HMR (Hot Module Replacement)
// This prevents multiple "ghost" jobs from running during development
const JOB_NAME = 'TBA_POLLING_JOB';
const BACKUP_JOB_NAME = 'DB_BACKUP_JOB';

if (!globalThis[JOB_NAME] && !globalThis[BACKUP_JOB_NAME]) {
	console.log('--- Starting Background Tasks ---');

	globalThis[JOB_NAME] = schedule.scheduleJob('*/15 * * * *', async () => {
		const enabled = await getEventSetting('autoTbaPull');
		if (enabled !== 'true') return;
		const eventCode = await getEventSetting('eventCode');
		if (!eventCode) return;
		if (!TBA_API_KEY) { console.warn('[TBA Poll] No TBA_API_KEY configured'); return; }
		try {
			const matchType = await getEventSetting('defaultMatchType');
			const skipMatches = matchType === 'practice';
			const result = await importFromTBA(eventCode, TBA_API_KEY, skipMatches);
			console.log(`[TBA Poll] ${result.teamsInserted} teams, ${result.matchesInserted} matches`);
			if (result.errors.length) console.warn('[TBA Poll] Errors:', result.errors);
		} catch (e) {
			console.error('[TBA Poll] Failed:', e);
		}
	});

	// Backup the database every 30 minutes, retaining up to 48 hours of backups
	globalThis[BACKUP_JOB_NAME] = schedule.scheduleJob('*/30 * * * *', async () => {
		try {
			await runBackup();
		} catch (err) {
			console.error('[Backup] Failed:', err);
		}
	});
}
