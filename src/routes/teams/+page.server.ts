import { db } from '$lib/server/db';
import { teams } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

export async function load() {
	const allTeams = await db.select().from(teams).orderBy(asc(teams.number)).all();
	return { teams: allTeams };
}
