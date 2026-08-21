import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSession } from '$lib/server/services/auth.service';

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get('admin-auth');
	if (sessionId) {
		await deleteSession(sessionId);
		cookies.delete('admin-auth', { path: '/' });
	}
	throw redirect(303, '/');
};

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get('admin-auth');
	if (sessionId) {
		await deleteSession(sessionId);
		cookies.delete('admin-auth', { path: '/' });
	}
	throw redirect(303, '/');
};
