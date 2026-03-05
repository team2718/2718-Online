import { db } from '$lib/server/db';
import { teams, scoutingReports, pitScoutingReports, matches } from '$lib/server/db/schema';
import { eq, inArray, asc } from 'drizzle-orm';

export async function load({ url }: { url: URL }) {
	const matchId = url.searchParams.get('match');

	const allMatches = await db
		.select({ id: matches.id, matchNumber: matches.matchNumber, matchType: matches.matchType })
		.from(matches)
		.orderBy(asc(matches.matchNumber))
		.all();

	if (!matchId) {
		return { matchId: null, match: null, allMatches, matchTeams: null, error: null };
	}

	const match = await db.select().from(matches).where(eq(matches.id, matchId)).get();
	if (!match) {
		return { matchId, match: null, allMatches, matchTeams: null, error: `Match "${matchId}" not found.` };
	}

	const teamNums = [match.red1, match.red2, match.red3, match.blue1, match.blue2, match.blue3].filter(
		(n): n is number => n != null
	);

	if (teamNums.length === 0) {
		return { matchId, match, allMatches, matchTeams: { red: [], blue: [] }, error: null };
	}

	const [allReports, allPitReports, teamRows] = await Promise.all([
		db.select().from(scoutingReports).where(inArray(scoutingReports.teamNumber, teamNums)).all(),
		db.select().from(pitScoutingReports).where(inArray(pitScoutingReports.teamNumber, teamNums)).all(),
		db.select().from(teams).where(inArray(teams.number, teamNums)).all()
	]);

	const teamMap = new Map(teamRows.map((t) => [t.number, t]));

	// Keep only the most recent pit report per team
	const pitMap = new Map<number, (typeof allPitReports)[number]>();
	for (const pr of allPitReports) {
		const existing = pitMap.get(pr.teamNumber);
		if (!existing || (pr.createdAt ?? 0) > (existing.createdAt ?? 0)) {
			pitMap.set(pr.teamNumber, pr);
		}
	}

	// Group reports by team
	const reportsByTeam = new Map<number, typeof allReports>();
	for (const r of allReports) {
		if (!reportsByTeam.has(r.teamNumber)) reportsByTeam.set(r.teamNumber, []);
		reportsByTeam.get(r.teamNumber)!.push(r);
	}

	const computeTeamStats = (teamNum: number) => {
		const team = teamMap.get(teamNum);
		const reports = reportsByTeam.get(teamNum) ?? [];
		const pit = pitMap.get(teamNum) ?? null;
		const meta = (team?.metadata ?? null) as Record<string, unknown> | null;

		const count = reports.length;
		const opr = typeof meta?.opr === 'number' ? meta.opr : null;

		if (count === 0) {
			return {
				number: teamNum,
				name: team?.name ?? `Team ${teamNum}`,
				opr,
				reportCount: 0,
				avgAutoFuel: null as number | null,
				avgTeleFuelRate: null as number | null,
				avgDefScore: null as number | null,
				defPercent: 0,
				avgPassScore: null as number | null,
				passPercent: 0,
				climbAtLeastL1Pct: 0,
				pit
			};
		}

		let autoFuelSum = 0, teleFuelSum = 0;
		let defSum = 0, defCount = 0;
		let passSum = 0, passCount = 0;
		let climbL1Plus = 0;

		for (const r of reports) {
			const d = r.data;
			if (!d) continue;
			autoFuelSum += Number(d.autoFuel) || 0;
			teleFuelSum += Number(d.teleFuelRateScore) || 0;
			if (d.teleDidDef) { defSum += Number(d.teleDefScore) || 0; defCount++; }
			if (d.teleDidPass) { passSum += Number(d.telePassScore) || 0; passCount++; }
			if ((d.climbType ?? 0) >= 1) climbL1Plus++;
		}

		return {
			number: teamNum,
			name: team?.name ?? `Team ${teamNum}`,
			opr,
			reportCount: count,
			avgAutoFuel: autoFuelSum / count,
			avgTeleFuelRate: teleFuelSum / count,
			avgDefScore: defCount > 0 ? defSum / defCount : null,
			defPercent: Math.round((defCount / count) * 100),
			avgPassScore: passCount > 0 ? passSum / passCount : null,
			passPercent: Math.round((passCount / count) * 100),
			climbAtLeastL1Pct: Math.round((climbL1Plus / count) * 100),
			pit
		};
	};

	const matchTeams = {
		red: [match.red1, match.red2, match.red3]
			.filter((n): n is number => n != null)
			.map(computeTeamStats),
		blue: [match.blue1, match.blue2, match.blue3]
			.filter((n): n is number => n != null)
			.map(computeTeamStats)
	};

	return { matchId, match, allMatches, matchTeams, error: null };
}
