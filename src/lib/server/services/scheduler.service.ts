import schedule from 'node-schedule';
import { isAutoTbaPullEnabled, getEventCode, getDefaultMatchType } from './settings.service';
import { syncEventData } from './sync.service';
import { runBackup } from '$lib/server/backup';
import { purgeExpiredSessions } from './auth.service';
import { TBA_API_KEY } from '$lib/server/config';

const TBA_JOB_KEY = '__2718_TBA_POLL_JOB__';
const BACKUP_JOB_KEY = '__2718_DB_BACKUP_JOB__';
const SESSION_PURGE_JOB_KEY = '__2718_SESSION_PURGE_JOB__';

declare global {
	// eslint-disable-next-line no-var
	var __2718_TBA_POLL_JOB__: schedule.Job | undefined;
	// eslint-disable-next-line no-var
	var __2718_DB_BACKUP_JOB__: schedule.Job | undefined;
	// eslint-disable-next-line no-var
	var __2718_SESSION_PURGE_JOB__: schedule.Job | undefined;
}

/**
 * Initializes recurring background workers for TBA polling, backups, and session cleanup.
 * Uses global singleton hooks to prevent duplicate tasks during Vite HMR development.
 */
export function startBackgroundTasks(): void {
	if (globalThis[TBA_JOB_KEY] || globalThis[BACKUP_JOB_KEY]) {
		return;
	}

	console.log('[Scheduler] Starting background worker tasks...');

	// 1. TBA polling job: runs every 15 minutes
	globalThis[TBA_JOB_KEY] = schedule.scheduleJob('*/15 * * * *', async () => {
		try {
			const enabled = await isAutoTbaPullEnabled();
			if (!enabled) return;

			const eventCode = await getEventCode();
			if (!eventCode) return;

			if (!TBA_API_KEY) {
				console.warn('[Scheduler TBA Poll] Skipping: No TBA_API_KEY configured');
				return;
			}

			const defaultMatchType = await getDefaultMatchType();
			const skipMatches = defaultMatchType === 'practice';

			const result = await syncEventData(eventCode, TBA_API_KEY, skipMatches);
			console.log(
				`[Scheduler TBA Poll] Synced ${result.teamsInserted} teams, ${result.matchesInserted} matches.`
			);
			if (result.errors.length > 0) {
				console.warn('[Scheduler TBA Poll] Errors encountered:', result.errors);
			}
		} catch (err) {
			console.error('[Scheduler TBA Poll] Job failed:', err);
		}
	});

	// 2. Database backup job: runs every 30 minutes
	globalThis[BACKUP_JOB_KEY] = schedule.scheduleJob('*/30 * * * *', async () => {
		try {
			await runBackup();
		} catch (err) {
			console.error('[Scheduler Backup] Job failed:', err);
		}
	});

	// 3. Stale session purge job: runs every hour
	globalThis[SESSION_PURGE_JOB_KEY] = schedule.scheduleJob('0 * * * *', async () => {
		try {
			await purgeExpiredSessions();
		} catch (err) {
			console.error('[Scheduler Session Purge] Job failed:', err);
		}
	});
}

/**
 * Cancels all scheduled background jobs.
 */
export function stopBackgroundTasks(): void {
	if (globalThis[TBA_JOB_KEY]) {
		globalThis[TBA_JOB_KEY]?.cancel();
		delete globalThis[TBA_JOB_KEY];
	}
	if (globalThis[BACKUP_JOB_KEY]) {
		globalThis[BACKUP_JOB_KEY]?.cancel();
		delete globalThis[BACKUP_JOB_KEY];
	}
	if (globalThis[SESSION_PURGE_JOB_KEY]) {
		globalThis[SESSION_PURGE_JOB_KEY]?.cancel();
		delete globalThis[SESSION_PURGE_JOB_KEY];
	}
}
