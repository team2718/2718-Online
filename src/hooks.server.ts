import type { Handle } from '@sveltejs/kit';
import { checkSessionLevel } from '$lib/server/services/auth.service';
import { startBackgroundTasks } from '$lib/server/services/scheduler.service';

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

// Start scheduled tasks (TBA sync, DB backups, stale session purging)
startBackgroundTasks();
