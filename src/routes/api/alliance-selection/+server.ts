import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEventSetting, setEventSetting } from '$lib/server/db';

const EMPTY_ALLIANCES: (number | null)[][] = Array.from({ length: 8 }, () => [null, null, null, null]);

async function loadState(): Promise<{ alliances: (number | null)[][]; version: number }> {
	const raw = await getEventSetting('allianceSelection');
	if (raw) {
		try {
			const parsed = JSON.parse(raw);
			if (parsed.alliances && Array.isArray(parsed.alliances)) {
				return { alliances: parsed.alliances, version: parsed.version ?? 0 };
			}
		} catch {
			// fall through to default
		}
	}
	return { alliances: EMPTY_ALLIANCES, version: 0 };
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.privileged) return json({ error: 'Unauthorized' }, { status: 401 });
	const state = await loadState();
	return json(state);
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	if (!locals.privileged) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const alliances: (number | null)[][] = body.alliances;

	if (!Array.isArray(alliances) || alliances.length !== 8) {
		return json({ error: 'Invalid alliances data' }, { status: 400 });
	}

	const current = await loadState();
	const newVersion = current.version + 1;
	await setEventSetting('allianceSelection', JSON.stringify({ alliances, version: newVersion }));
	return json({ version: newVersion });
};

export const DELETE: RequestHandler = async ({ locals }) => {
	if (!locals.privileged) return json({ error: 'Unauthorized' }, { status: 401 });
	const newVersion = (await loadState()).version + 1;
	await setEventSetting('allianceSelection', JSON.stringify({ alliances: EMPTY_ALLIANCES, version: newVersion }));
	return json({ version: newVersion });
};
