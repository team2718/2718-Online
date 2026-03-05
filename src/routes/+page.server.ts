import { db } from '$lib/server/db';
import { teams, scoutingReports, pitScoutingReports, matches } from '$lib/server/db/schema';

export async function load() {
	const [allReports, allTeams, pitCoverage, matchCount] = await Promise.all([
		db.select().from(scoutingReports).all(),
		db.select({ number: teams.number, name: teams.name }).from(teams).all(),
		db.select({ teamNumber: pitScoutingReports.teamNumber }).from(pitScoutingReports).all(),
		db.select({ id: matches.id }).from(matches).all()
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
		teleFuelRateSum: number;
		defScoreSum: number;
		teleAccSum: number;
		climbL2Plus: number;
		autoLeave: number;
	};

	const teamMap = new Map<number, TeamAgg>();
	for (const t of allTeams) {
		teamMap.set(t.number, {
			number: t.number,
			name: t.name,
			count: 0,
			autoFuelSum: 0,
			teleFuelRateSum: 0,
			defScoreSum: 0,
			teleAccSum: 0,
			climbL2Plus: 0,
			autoLeave: 0
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
				teleFuelRateSum: 0,
				defScoreSum: 0,
				teleAccSum: 0,
				climbL2Plus: 0,
				autoLeave: 0
			};
			teamMap.set(r.teamNumber, agg);
		}
		agg.count++;
		agg.autoFuelSum += Number(d.autoFuel) || 0;
		agg.teleFuelRateSum += Number(d.teleFuelRateScore) || 0;
		agg.defScoreSum += Number(d.teleDefScore) || 0;
		agg.teleAccSum += Number(d.teleAccScore) || 0;
		if ((d.climbType ?? 0) >= 2) agg.climbL2Plus++;
		if (d.didLeave) agg.autoLeave++;
	}

	const teamStats = [...teamMap.values()]
		.filter((t) => t.count > 0)
		.map((t) => ({
			number: t.number,
			name: t.name,
			count: t.count,
			avgAutoFuel: t.autoFuelSum / t.count,
			avgTeleFuelRate: t.teleFuelRateSum / t.count,
			avgDefScore: t.defScoreSum / t.count,
			avgTeleAcc: t.teleAccSum / t.count,
			climbPct: (t.climbL2Plus / t.count) * 100,
			autoLeavePct: (t.autoLeave / t.count) * 100
		}));

	const top = (key: keyof (typeof teamStats)[number], n = 8) =>
		[...teamStats]
			.sort((a, b) => (b[key] as number) - (a[key] as number))
			.slice(0, n)
			.map((t) => ({ number: t.number, name: t.name, value: t[key] as number, count: t.count }));

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
			teleopRate: top('avgTeleFuelRate'),
			defense: top('avgDefScore'),
			climbing: top('climbPct'),
			autoLeave: top('autoLeavePct')
		}
	};
}
