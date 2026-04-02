import { db } from '$lib/server/db';
import { teams, scoutingReports, pitScoutingReports, matches } from '$lib/server/db/schema';
import { eq, inArray, asc, or } from 'drizzle-orm';
import { getEpopBeforeMatch, getEpop } from '$lib/server/epop';

const OUR_TEAM = 2718;

export async function load({ url }: { url: URL }) {
	const matchId = url.searchParams.get('match');

	const [allMatches, ourMatches] = await Promise.all([
		db
			.select({ id: matches.id, matchNumber: matches.matchNumber, matchType: matches.matchType })
			.from(matches)
			.orderBy(asc(matches.matchNumber))
			.all(),
		db
			.select({ id: matches.id, matchNumber: matches.matchNumber, matchType: matches.matchType })
			.from(matches)
			.where(or(
				eq(matches.red1, OUR_TEAM), eq(matches.red2, OUR_TEAM), eq(matches.red3, OUR_TEAM),
				eq(matches.blue1, OUR_TEAM), eq(matches.blue2, OUR_TEAM), eq(matches.blue3, OUR_TEAM)
			))
			.orderBy(asc(matches.matchNumber))
			.all()
	]);

	if (!matchId) {
		return { matchId: null, match: null, allMatches, ourMatches, matchTeams: null, error: null };
	}

	const match = await db.select().from(matches).where(eq(matches.id, matchId)).get();
	if (!match) {
		return { matchId, match: null, allMatches, ourMatches, matchTeams: null, error: `Match "${matchId}" not found.` };
	}

	const teamNums = [match.red1, match.red2, match.red3, match.blue1, match.blue2, match.blue3].filter(
		(n): n is number => n != null
	);

	if (teamNums.length === 0) {
		return { matchId, match, allMatches, ourMatches, matchTeams: { red: [], blue: [] }, error: null };
	}

	const [allReports, allPitReports, teamRows, epopMap] = await Promise.all([
		db.select().from(scoutingReports).where(inArray(scoutingReports.teamNumber, teamNums)).all(),
		db.select().from(pitScoutingReports).where(inArray(pitScoutingReports.teamNumber, teamNums)).all(),
		db.select().from(teams).where(inArray(teams.number, teamNums)).all(),
		match.matchType === 'playoff' ? getEpop() : getEpopBeforeMatch(match.matchNumber)
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

		const count = reports.length;
		const epop = epopMap.get(teamNum) ?? null;

		if (count === 0) {
			return {
				number: teamNum,
				name: team?.name ?? `Team ${teamNum}`,
				epop,
				reportCount: 0,
				avgAutoFuel: null as number | null,
				avgTeleFuelScore: null as number | null,
				fuelPercent: 0,
				avgDefScore: null as number | null,
				defPercent: 0,
				avgPassScore: null as number | null,
				passPercent: 0,
				climbL1Pct: 0,
				climbL2Pct: 0,
				climbL3Pct: 0,
				rampPct: 0,
				trenchPct: 0,
				pit
			};
		}

		let autoFuelSum = 0, teleFuelSum = 0;
		let fuelCount = 0;
		let defSum = 0, defCount = 0;
		let passSum = 0, passCount = 0;
		let rampCount = 0, trenchCount = 0;
		let climbL1Count = 0, climbL2Count = 0, climbL3Count = 0;

		for (const r of reports) {
			const d = r.data;
			if (!d) continue;
			autoFuelSum += Number(d.autoFuel) || 0;
			teleFuelSum += Number(d.teleFuelScore) || 0;
			if ((d.teleDidScore ?? Number(d.teleFuelScore) > 0) === true) fuelCount++;
			if (d.teleDidDef) { defSum += Number(d.teleDefScore) || 0; defCount++; }
			if (d.teleDidPass) { passSum += Number(d.telePassScore) || 0; passCount++; }
			const climbType = d.climbType ?? 0;
			if (climbType == 1) climbL1Count++;
			if (climbType == 2) climbL2Count++;
			if (climbType == 3) climbL3Count++;
			if ((d as any).teleUsesRamp) rampCount++;
			if ((d as any).teleUsesTrench) trenchCount++;
		}

		return {
			number: teamNum,
			name: team?.name ?? `Team ${teamNum}`,
			epop,
			reportCount: count,
			avgAutoFuel: autoFuelSum / count,
			avgTeleFuelScore: teleFuelSum / count,
			fuelPercent: Math.round((fuelCount / count) * 100),
			avgDefScore: defCount > 0 ? defSum / defCount : null,
			defPercent: Math.round((defCount / count) * 100),
			avgPassScore: passCount > 0 ? passSum / passCount : null,
			passPercent: Math.round((passCount / count) * 100),
			climbL1Pct: Math.round((climbL1Count / count) * 100),
			climbL2Pct: Math.round((climbL2Count / count) * 100),
			climbL3Pct: Math.round((climbL3Count / count) * 100),
			rampPct: Math.round((rampCount / count) * 100),
			trenchPct: Math.round((trenchCount / count) * 100),
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

	return { matchId, match, allMatches, ourMatches, matchTeams, error: null };
}
