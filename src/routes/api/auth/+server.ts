import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createHash } from 'crypto';
import { dev } from '$app/environment';
import { ADMIN_PASSWORD_HASH, PRIVILEGED_PASSWORD_HASH, ADMIN_SESSION_EXPIRY_HOURS } from '$lib/server/config';
import { saveAdminSessionKey } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const password = body?.password;

	if (typeof password !== 'string') {
		return json({ error: 'Invalid input' }, { status: 400 });
	}

	const hashed = createHash('sha256').update(password).digest('hex');

	let level: 'admin' | 'privileged' | null = null;
	if (hashed === ADMIN_PASSWORD_HASH) {
		level = 'admin';
	} else if (hashed === PRIVILEGED_PASSWORD_HASH) {
		level = 'privileged';
	}

	if (!level) {
		return json({ error: 'Incorrect password' }, { status: 401 });
	}

	const sessionToken = crypto.randomUUID();
	await saveAdminSessionKey(sessionToken, level);

	cookies.set('admin-auth', sessionToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: 60 * 60 * ADMIN_SESSION_EXPIRY_HOURS
	});

	return json({ level });
};
