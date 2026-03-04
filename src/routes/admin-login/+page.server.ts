import { ADMIN_PASSWORD_HASH, ADMIN_SESSION_EXPIRY_HOURS } from '$lib/server/config';
import { saveAdminSessionKey } from '$lib/server/db';
import type { Actions } from '../admin-login/$types';
import { fail, redirect } from '@sveltejs/kit';
import { createHash } from 'crypto';
import { dev } from '$app/environment';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password');

		if (typeof password !== 'string') {
			return fail(400, { error: 'Invalid input' });
		}

		const hashedInput = createHash('sha256').update(password).digest('hex');

		if (hashedInput === ADMIN_PASSWORD_HASH) {
			// Generate a session token
			const sessionToken = crypto.randomUUID();

			// Store sessionToken in your database
			await saveAdminSessionKey(sessionToken);

			// Set cookie
			cookies.set('admin-auth', sessionToken, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: !dev,
				maxAge: 60 * 60 * ADMIN_SESSION_EXPIRY_HOURS
			});

			throw redirect(303, '/admin');
		}

		return fail(401, { error: 'Incorrect password' });
	}
};