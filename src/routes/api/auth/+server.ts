import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { ADMIN_SESSION_EXPIRY_HOURS } from '$lib/server/config';
import {
	verifyPassword,
	createSession,
	isRateLimited,
	recordAuthFailure,
	recordAuthSuccess
} from '$lib/server/services/auth.service';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const ip = getClientAddress ? getClientAddress() : 'unknown';

	if (isRateLimited(ip)) {
		return json(
			{ error: 'Too many failed login attempts. Please wait 5 minutes before trying again.' },
			{ status: 429 }
		);
	}

	let body: { password?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON request' }, { status: 400 });
	}

	const password = body?.password;
	if (typeof password !== 'string' || !password) {
		return json({ error: 'Password is required' }, { status: 400 });
	}

	const level = verifyPassword(password);
	if (!level) {
		recordAuthFailure(ip);
		return json({ error: 'Incorrect password' }, { status: 401 });
	}

	recordAuthSuccess(ip);
	const sessionToken = await createSession(level);

	cookies.set('admin-auth', sessionToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: 60 * 60 * ADMIN_SESSION_EXPIRY_HOURS
	});

	return json({ success: true, level });
};
