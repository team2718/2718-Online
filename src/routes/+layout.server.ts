import { db } from '$lib/server/db';
import { teams } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

export async function load() {
	const teamSearchList = await db
		.select({ number: teams.number, name: teams.name })
		.from(teams)
		.orderBy(asc(teams.number))
		.all();
	return { teamSearchList };
}
