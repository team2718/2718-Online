import { db } from '$lib/server/db';
import { teams, matches } from '$lib/server/db/schema';
import { asc, and, isNotNull, eq } from 'drizzle-orm';
import { getEpop } from '$lib/server/epop';

export async function load() {
	const [allTeams, scoredQualMatches, epopMap] = await Promise.all([
		db.select().from(teams).orderBy(asc(teams.number)).all(),
		db
			.select({
				red1: matches.red1, red2: matches.red2, red3: matches.red3,
				blue1: matches.blue1, blue2: matches.blue2, blue3: matches.blue3,
				redScore: matches.redScore, blueScore: matches.blueScore
			})
			.from(matches)
			.where(and(eq(matches.matchType, 'qualification'), isNotNull(matches.redScore)))
			.all(),
		getEpop()
	]);

	// Build W-L-T record from scored qualification matches
	const recordMap = new Map<number, { wins: number; losses: number; ties: number }>();
	for (const m of scoredQualMatches) {
		if (m.redScore == null || m.blueScore == null) continue;
		const redTeams = [m.red1, m.red2, m.red3].filter((n): n is number => n != null);
		const blueTeams = [m.blue1, m.blue2, m.blue3].filter((n): n is number => n != null);
		const redWon = m.redScore > m.blueScore;
		const blueWon = m.blueScore > m.redScore;
		for (const t of redTeams) {
			if (!recordMap.has(t)) recordMap.set(t, { wins: 0, losses: 0, ties: 0 });
			const rec = recordMap.get(t)!;
			if (redWon) rec.wins++; else if (blueWon) rec.losses++; else rec.ties++;
		}
		for (const t of blueTeams) {
			if (!recordMap.has(t)) recordMap.set(t, { wins: 0, losses: 0, ties: 0 });
			const rec = recordMap.get(t)!;
			if (blueWon) rec.wins++; else if (redWon) rec.losses++; else rec.ties++;
		}
	}

	return {
		teams: allTeams.map((t) => ({
			number: t.number,
			name: t.name,
			epop: epopMap.get(t.number) ?? null,
			record: recordMap.get(t.number) ?? { wins: 0, losses: 0, ties: 0 },
			rankingPoints:
				t.metadata != null &&
				'ranking_score' in t.metadata &&
				typeof t.metadata.ranking_score === 'number'
					? (t.metadata.ranking_score as number)
					: null
		}))
	};
}
