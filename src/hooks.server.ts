// src/hooks.server.ts

import type { Handle } from '@sveltejs/kit';
import schedule from 'node-schedule';
import { checkAdminSessionKey } from '$lib/server/db';
import { runBackup } from '$lib/server/backup';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('admin-auth');
	let hasAdminSession = false;
	if (sessionId) {
		hasAdminSession = await checkAdminSessionKey(sessionId);
		if (!hasAdminSession) {
			event.cookies.delete('admin-auth', { path: '/' });
		}
	}
	event.locals.admin = hasAdminSession;
	return resolve(event);
};

// Use global variables to persist jobs across HMR (Hot Module Replacement)
// This prevents multiple "ghost" jobs from running during development
const JOB_NAME = 'TBA_POLLING_JOB';
const BACKUP_JOB_NAME = 'DB_BACKUP_JOB';

if (!globalThis[JOB_NAME] && !globalThis[BACKUP_JOB_NAME]) {
	console.log('--- Starting Background Tasks ---');

	// globalThis[JOB_NAME] = schedule.scheduleJob('*/1 * * * *', async () => {
	// 	console.log('Polling Match Data from TBA...');
	// 	// Your logic here
	// });

	// Backup the database every 30 minutes, retaining up to 48 hours of backups
	globalThis[BACKUP_JOB_NAME] = schedule.scheduleJob('*/30 * * * *', async () => {
		try {
			await runBackup();
		} catch (err) {
			console.error('[Backup] Failed:', err);
		}
	});
}
