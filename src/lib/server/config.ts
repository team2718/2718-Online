import { env } from '$env/dynamic/private';

export const DATABASE_URL = env.DATABASE_URL || '';

if (!env.ADMIN_PASSWORD_SHA256) {
	throw new Error('ADMIN_PASSWORD_SHA256 is not set in the environment variables.');
}

export const ADMIN_PASSWORD_HASH = env.ADMIN_PASSWORD_SHA256.trim().toLowerCase();

if (!env.PRIVILEGED_PASSWORD_SHA256) {
	throw new Error('PRIVILEGED_PASSWORD_SHA256 is not set in the environment variables.');
}

export const PRIVILEGED_PASSWORD_HASH = env.PRIVILEGED_PASSWORD_SHA256.trim().toLowerCase();

export const ADMIN_SESSION_EXPIRY_HOURS = env.ADMIN_SESSION_EXPIRY_HOURS
	? Number(env.ADMIN_SESSION_EXPIRY_HOURS)
	: 12;

// Optional — can also be supplied per-request from the admin UI
export const TBA_API_KEY = env.TBA_API_KEY ?? '';