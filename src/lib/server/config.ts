import { env } from '$env/dynamic/private';

export const DATABASE_URL = env.DATABASE_URL || '';

export const ADMIN_PASSWORD_HASH = env.ADMIN_PASSWORD_SHA256 || '';

export const ADMIN_SESSION_EXPIRY_HOURS = env.ADMIN_SESSION_EXPIRY_HOURS
	? Number(env.ADMIN_SESSION_EXPIRY_HOURS)
	: 12;
