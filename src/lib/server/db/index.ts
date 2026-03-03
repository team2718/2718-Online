import { eq, and } from 'drizzle-orm';
import { admin_sessions, scoutingReports, pitScoutingReports } from './schema';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { DATABASE_URL, ADMIN_SESSION_EXPIRY_HOURS } from '../config';

const client = createClient({ url: DATABASE_URL });
export const db = drizzle(client, { schema });

// --- Auth Functions ---

export function saveAdminSessionKey(sessionToken: string) {
	return db.insert(schema.admin_sessions).values({ cookieId: sessionToken }).run();
}

export async function checkAdminSessionKey(sessionId: string): Promise<boolean> {
	if (!sessionId) return false;

	const session = await db
		.select()
		.from(admin_sessions)
		.where(eq(admin_sessions.cookieId, sessionId))
		.get();

	if (session) {
		const now = Math.floor(Date.now() / 1000);
		if (session.createdAt == null || now - session.createdAt > 60 * 60 * ADMIN_SESSION_EXPIRY_HOURS) {
			await db.delete(admin_sessions).where(eq(admin_sessions.cookieId, sessionId)).run();
			return false;
		}
		return true;
	}
	return false;
}

// --- Scouting Report Functions ---

/**
 * Add a new match scouting report
 */
export async function addScoutingReport(report: typeof scoutingReports.$inferInsert) {
	return await db.insert(scoutingReports).values(report).run();
}

/**
 * Retrieve match reports with optional filters
 */
export async function getScoutingReports(filters?: { matchId?: string; teamNumber?: number }) {
	if (filters?.matchId && filters?.teamNumber) {
		return await db.query.scoutingReports.findMany({
			where: and(
				eq(scoutingReports.matchId, filters.matchId),
				eq(scoutingReports.teamNumber, filters.teamNumber)
			)
		});
	} else if (filters?.matchId) {
		return await db.query.scoutingReports.findMany({
			where: eq(scoutingReports.matchId, filters.matchId)
		});
	} else if (filters?.teamNumber) {
		return await db.query.scoutingReports.findMany({
			where: eq(scoutingReports.teamNumber, filters.teamNumber)
		});
	}
	return await db.query.scoutingReports.findMany();
}

/**
 * Add a new pit scouting report
 */
export async function addPitReport(report: typeof pitScoutingReports.$inferInsert) {
	return await db.insert(pitScoutingReports).values(report).run();
}

/**
 * Retrieve pit reports by team or all
 */
export async function getPitReports(teamNumber?: number) {
	if (teamNumber) {
		return await db.query.pitScoutingReports.findMany({
			where: eq(pitScoutingReports.teamNumber, teamNumber)
		});
	}
	return await db.query.pitScoutingReports.findMany();
}