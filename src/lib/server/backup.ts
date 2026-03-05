// src/lib/server/backup.ts

import { db } from '$lib/server/db';
import { DATABASE_URL } from '$lib/server/config';
import { sql } from 'drizzle-orm';
import { mkdirSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';

const BACKUP_RETENTION_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Resolves the local SQLite file path from DATABASE_URL.
 * Returns null if the database is remote (Turso/libsql URL).
 */
function getDbFilePath(): string | null {
	if (!DATABASE_URL) return null;

	// Remote Turso / libsql URLs — no local file to copy
	if (
		DATABASE_URL.startsWith('libsql://') ||
		DATABASE_URL.startsWith('http://') ||
		DATABASE_URL.startsWith('https://')
	) {
		return null;
	}

	// Strip the "file:" prefix used by libsql (e.g. "file:./local.db" → "./local.db")
	const rawPath = DATABASE_URL.startsWith('file:') ? DATABASE_URL.slice(5) : DATABASE_URL;

	return resolve(rawPath);
}

/**
 * Creates a timestamped backup of the SQLite database using VACUUM INTO,
 * then prunes any backups older than 48 hours.
 *
 * Backups are written to a `backups/` directory next to the database file.
 */
export async function runBackup(): Promise<void> {
	const dbPath = getDbFilePath();

	if (!dbPath) {
		console.log('[Backup] Skipping — DATABASE_URL points to a remote database.');
		return;
	}

	const backupDir = join(dirname(dbPath), 'backups');
	mkdirSync(backupDir, { recursive: true });

	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const backupPath = join(backupDir, `backup-${timestamp}.db`);

	// VACUUM INTO creates a clean, consistent copy of the database safe to use
	// while the database is live. Single quotes in the path are escaped by doubling.
	const escapedPath = backupPath.replace(/'/g, "''");
	await db.run(sql.raw(`VACUUM INTO '${escapedPath}'`));

	console.log(`[Backup] Database backed up to ${backupPath}`);

	// Prune backups older than the retention window
	const cutoff = Date.now() - BACKUP_RETENTION_MS;
	for (const file of readdirSync(backupDir)) {
		if (!file.startsWith('backup-') || !file.endsWith('.db')) continue;
		const filePath = join(backupDir, file);
		if (statSync(filePath).mtimeMs < cutoff) {
			unlinkSync(filePath);
			console.log(`[Backup] Pruned old backup: ${file}`);
		}
	}
}
