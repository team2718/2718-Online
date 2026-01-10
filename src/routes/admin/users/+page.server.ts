import { fail } from '@sveltejs/kit';
import { getAllUsers, addUser, deleteUser } from '$lib/server/db';

export const load = async () => {
	const users = await getAllUsers();
	return { users };
};

export const actions = {
	add: async ({ request }) => {
		const form = await request.formData();

		await new Promise((fulfil) => setTimeout(fulfil, 1000));

		const name = form.get('name');

		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return fail(400, { error: 'Name is required' });
		}

		try {
			await addUser(name.trim());
		} catch (e) {
			return fail(500, { error: 'Failed to add user' });
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const form = await request.formData();

		await new Promise((fulfil) => setTimeout(fulfil, 1000));

		const id = form.get('id');

		if (!id || typeof id !== 'string') {
			return fail(400, { error: 'User ID required' });
		}

		try {
			await deleteUser(id);
		} catch (e) {
			return fail(500, { error: 'Failed to delete user' });
		}

		return { success: true };
	}
};
