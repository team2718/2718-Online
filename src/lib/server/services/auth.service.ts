import { createHash, timingSafeEqual } from 'crypto';
import { eq, lt } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { admin_sessions } from '$lib/server/db/schema';
import {
	ADMIN_PASSWORD_HASH,
	PRIVILEGED_PASSWORD_HASH,
	ADMIN_SESSION_EXPIRY_HOURS
} from '$lib/server/config';
import type { SessionLevel } from '$lib/types';

// Rate limiting state for brute-force protection
interface RateLimitEntry {
	failures: number;
	lockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_FAILURES = 8;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Checks if an IP or identifier is temporarily locked out due to failed attempts.
 */
export function isRateLimited(identifier: string): boolean {
	const entry = rateLimitMap.get(identifier);
	if (!entry) return false;
	if (Date.now() > entry.lockedUntil) {
		rateLimitMap.delete(identifier);
		return false;
	}
	return entry.failures >= MAX_FAILURES;
}

/**
 * Records a failed authentication attempt for rate limiting.
 */
export function recordAuthFailure(identifier: string): void {
	const now = Date.now();
	const entry = rateLimitMap.get(identifier) ?? { failures: 0, lockedUntil: now + LOCKOUT_MS };
	entry.failures += 1;
	entry.lockedUntil = now + LOCKOUT_MS;
	rateLimitMap.set(identifier, entry);
}

/**
 * Resets rate limit counter on successful authentication.
 */
export function recordAuthSuccess(identifier: string): void {
	rateLimitMap.delete(identifier);
}

/**
 * Timing-safe string comparison using SHA-256 byte buffers.
 */
function safeCompareHash(inputHash: string, targetHash: string): boolean {
	if (!inputHash || !targetHash) return false;
	try {
		const bufA = Buffer.from(inputHash, 'hex');
		const bufB = Buffer.from(targetHash, 'hex');
		if (bufA.length !== bufB.length) return false;
		return timingSafeEqual(bufA, bufB);
	} catch {
		return false;
	}
}

/**
 * Verifies raw password against configured admin & privileged hashes in constant time.
 */
export function verifyPassword(password: string): SessionLevel | null {
	if (!password || typeof password !== 'string') return null;

	const hashedInput = createHash('sha256').update(password).digest('hex').toLowerCase();

	if (safeCompareHash(hashedInput, ADMIN_PASSWORD_HASH)) {
		return 'admin';
	}
	if (safeCompareHash(hashedInput, PRIVILEGED_PASSWORD_HASH)) {
		return 'privileged';
	}

	return null;
}

/**
 * Creates and stores a new authenticated session in the database.
 */
export async function createSession(level: SessionLevel): Promise<string> {
	const sessionToken = crypto.randomUUID();
	await db.insert(admin_sessions).values({ cookieId: sessionToken, level }).run();
	return sessionToken;
}

/**
 * Validates a session token, checks expiry, and returns the session level.
 */
export async function checkSessionLevel(sessionId: string): Promise<SessionLevel | null> {
	if (!sessionId) return null;

	const session = await db
		.select()
		.from(admin_sessions)
		.where(eq(admin_sessions.cookieId, sessionId))
		.get();

	if (session) {
		const now = Math.floor(Date.now() / 1000);
		const expirySeconds = 60 * 60 * ADMIN_SESSION_EXPIRY_HOURS;
		if (session.createdAt == null || now - session.createdAt > expirySeconds) {
			await db.delete(admin_sessions).where(eq(admin_sessions.cookieId, sessionId)).run();
			return null;
		}
		return session.level as SessionLevel;
	}
	return null;
}

/**
 * Deletes a session token from the database (logout).
 */
export async function deleteSession(sessionId: string): Promise<void> {
	if (!sessionId) return;
	await db.delete(admin_sessions).where(eq(admin_sessions.cookieId, sessionId)).run();
}

/**
 * Purges all expired sessions from the database.
 */
export async function purgeExpiredSessions(): Promise<void> {
	const now = Math.floor(Date.now() / 1000);
	const cutoff = now - 60 * 60 * ADMIN_SESSION_EXPIRY_HOURS;
	await db.delete(admin_sessions).where(lt(admin_sessions.createdAt, cutoff)).run();
}

