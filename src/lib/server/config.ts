import { env } from '$env/dynamic/private';

export const DATABASE_URL = env.DATABASE_URL || '';

if (!env.ADMIN_PASSWORD_SHA256) {
	throw new Error('ADMIN_PASSWORD_SHA256 is not set in the environment variables.');
}

export const ADMIN_PASSWORD_HASH = env.ADMIN_PASSWORD_SHA256;

export const ADMIN_SESSION_EXPIRY_HOURS = env.ADMIN_SESSION_EXPIRY_HOURS
	? Number(env.ADMIN_SESSION_EXPIRY_HOURS)
	: 12;