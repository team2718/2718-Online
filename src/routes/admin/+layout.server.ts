import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { resolve } from '$app/paths';

export const load: LayoutServerLoad = async ({ locals }) => {
	// if (import.meta.env.DEV) {
	//     return {};
	// }
	if (!locals.admin) {
		throw redirect(302, resolve('/admin-login'));
	}
	return {};
};
