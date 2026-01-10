// src/hooks.server.ts

import type { Handle } from '@sveltejs/kit';
import schedule from 'node-schedule';
import { checkAdminSessionKey } from '$lib/server/db';

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

// Use a global variable to persist the job across HMR (Hot Module Replacement)
// This prevents multiple "ghost" jobs from running during development
const JOB_NAME = 'TBA_POLLING_JOB';

if (!globalThis[JOB_NAME]) {
	console.log('--- Starting Background Tasks ---');

	globalThis[JOB_NAME] = schedule.scheduleJob('*/1 * * * *', async () => {
		console.log('Polling Match Data from TBA...');
		// Your logic here
	});
}
