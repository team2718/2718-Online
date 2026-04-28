import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { admin_sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionToken = cookies.get('admin-auth');
	if (sessionToken) {
		await db.delete(admin_sessions).where(eq(admin_sessions.cookieId, sessionToken)).run();
	}
	cookies.delete('admin-auth', { path: '/' });
	throw redirect(303, '/');
};
