import { db } from '$lib/server/db';
import { getEpop } from '$lib/server/epop';
import { teams, scoutingReports, pitScoutingReports, matches } from '$lib/server/db/schema';

export async function load() {
	const [allReports, allTeams, pitCoverage, matchCount, epopMap] = await Promise.all([
		db.select().from(scoutingReports).all(),
		db.select({ number: teams.number, name: teams.name }).from(teams).all(),
		db.select({ teamNumber: pitScoutingReports.teamNumber }).from(pitScoutingReports).all(),
		db.select({ id: matches.id }).from(matches).all(),
		getEpop()
	]);

	// --- Coverage stats ---
	const totalTeams = allTeams.length;
	const matchesWithReports = new Set(allReports.map((r) => r.matchId)).size;
	const pitScoutedTeams = new Set(pitCoverage.map((r) => r.teamNumber)).size;
	const totalReports = allReports.length;
	const totalMatchesScheduled = matchCount.length;

	// --- Per-team aggregates ---
	type TeamAgg = {
		number: number;
		name: string;
		count: number;
		autoFuelSum: number;
		teleFuelSum: number;
		defScoreSum: number;
		defCount: number;
		passScoreSum: number;
		passCount: number;
		climbL1Plus: number;
	};

	const teamMap = new Map<number, TeamAgg>();
	for (const t of allTeams) {
		teamMap.set(t.number, {
			number: t.number,
			name: t.name,
			count: 0,
			autoFuelSum: 0,
			teleFuelSum: 0,
			defScoreSum: 0,
			defCount: 0,
			passScoreSum: 0,
			passCount: 0,
			climbL1Plus: 0
		});
	}

	for (const r of allReports) {
		const d = r.data;
		if (!d) continue;
		let agg = teamMap.get(r.teamNumber);
		if (!agg) {
			agg = {
				number: r.teamNumber,
				name: `Team ${r.teamNumber}`,
				count: 0,
				autoFuelSum: 0,
				teleFuelSum: 0,
				defScoreSum: 0,
				defCount: 0,
				passScoreSum: 0,
				passCount: 0,
				climbL1Plus: 0
			};
			teamMap.set(r.teamNumber, agg);
		}
		agg.count++;
		agg.autoFuelSum += Number(d.autoFuel) || 0;
		agg.teleFuelSum += Number(d.teleFuelScore) || 0;
		if (d.teleDidDef) {
			agg.defScoreSum += Number(d.teleDefScore) || 0;
			agg.defCount++;
		}
		if (d.teleDidPass) {
			agg.passScoreSum += Number(d.telePassScore) || 0;
			agg.passCount++;
		}
		if ((d.climbType ?? 0) >= 1) agg.climbL1Plus++;
	}

	const teamStats = [...teamMap.values()]
		.filter((t) => t.count > 0)
		.map((t) => ({
			number: t.number,
			name: t.name,
			count: t.count,
			avgAutoFuel: t.autoFuelSum / t.count,
			avgTeleFuelScore: t.teleFuelSum / t.count,
			avgDefScore: t.defCount > 0 ? t.defScoreSum / t.defCount : 0,
			defCount: t.defCount,
			avgPassScore: t.passCount > 0 ? t.passScoreSum / t.passCount : 0,
			passCount: t.passCount,
			climbPct: (t.climbL1Plus / t.count) * 100
		}));

	const top = (
		key: keyof (typeof teamStats)[number],
		n = 8,
		predicate?: (t: (typeof teamStats)[number]) => boolean
	) =>
		[...teamStats]
			.filter(predicate ?? (() => true))
			.sort((a, b) => (b[key] as number) - (a[key] as number))
			.slice(0, n)
			.map((t) => ({ number: t.number, name: t.name, value: t[key] as number, count: t.count }));

	// --- ePOP Leaderboard ---
	const nameById = new Map(allTeams.map((t) => [t.number, t.name]));
	const epopLeaderboard = [...epopMap.entries()]
		.filter(([, v]) => v > 0)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([number, epop]) => ({ number, name: nameById.get(number) ?? `Team ${number}`, epop }));

	return {
		coverage: {
			totalTeams,
			totalMatchesScheduled,
			matchesWithReports,
			pitScoutedTeams,
			totalReports
		},
		rankings: {
			autoScoring: top('avgAutoFuel'),
			teleopRate: top('avgTeleFuelScore'),
			defense: top('avgDefScore', 8, (t) => t.defCount > 0),
			passScore: top('avgPassScore', 8, (t) => t.passCount > 0),
			climbing: top('climbPct')
		},
		epopLeaderboard
	};
}
