import { eq } from 'drizzle-orm';
import { admin_sessions, users } from './schema';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { DATABASE_URL, ADMIN_SESSION_EXPIRY_HOURS } from '../config';

const client = createClient({ url: DATABASE_URL });

export const db = drizzle(client, { schema });

export function saveAdminSessionKey(sessionToken: string) {
	return db.insert(schema.admin_sessions).values({ cookieId: sessionToken }).run();
}

export async function checkAdminSessionKey(sessionId: string): Promise<boolean> {
	if (!sessionId) {
		return false;
	}

	const session = await db
		.select()
		.from(admin_sessions)
		.where(eq(admin_sessions.cookieId, sessionId))
		.get();

	if (session) {
		const now = Math.floor(Date.now() / 1000);
		if (
			session.createdAt == null ||
			now - session.createdAt > 60 * 60 * ADMIN_SESSION_EXPIRY_HOURS
		) {
			// Expired or invalid, delete from DB
			await db.delete(admin_sessions).where(eq(admin_sessions.cookieId, sessionId)).run();
			return false;
		} else {
			return true;
		}
	} else {
		// Not found
		return false;
	}
}

// --- User CRUD for admin panel ---
import { randomUUID } from 'crypto';

import { usersToTeams } from './schema';

export async function getAllUsers() {
	// Join users to teams for display
	const userRows = await db.select().from(users).all();
	return userRows;
}

export async function addUser(name: string) {
	const id = randomUUID();
	await db.insert(users).values({ id, name }).run();
	return { id, name };
}

export async function deleteUser(id: string) {
	await db.delete(usersToTeams).where(eq(usersToTeams.userId, id)).run();
	await db.delete(users).where(eq(users.id, id)).run();
}
