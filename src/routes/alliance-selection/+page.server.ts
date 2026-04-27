import { redirect } from '@sveltejs/kit';
import { db, getScoutingReports, getEventSetting } from '$lib/server/db';
import { teams } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import { getEpop } from '$lib/server/epop';

export async function load({ locals }) {
	if (!locals.privileged) throw redirect(303, '/');

	const [allTeams, allReports, epopMap] = await Promise.all([
		db.select().from(teams).orderBy(asc(teams.number)).all(),
		getScoutingReports(),
		getEpop()
	]);

	// Build per-team scouting aggregates
	type ReportAgg = {
		defSum: number; defCount: number;
		passSum: number; passCount: number;
		total: number;
	};
	const agg = new Map<number, ReportAgg>();

	for (const r of allReports) {
		const tn = r.teamNumber;
		if (!agg.has(tn)) agg.set(tn, { defSum: 0, defCount: 0, passSum: 0, passCount: 0, total: 0 });
		const a = agg.get(tn)!;
		a.total++;
		if (r.data?.teleDidDef) { a.defSum += Number(r.data.teleDefScore) || 0; a.defCount++; }
		if (r.data?.teleDidPass) { a.passSum += Number(r.data.telePassScore) || 0; a.passCount++; }
	}

	const teamStats = allTeams.map((t) => {
		const a = agg.get(t.number);
		const rank = (t.metadata && typeof t.metadata === 'object' && 'rank' in t.metadata && typeof t.metadata.rank === 'number')
			? (t.metadata.rank as number)
			: null;
		return {
			number: t.number,
			name: t.name,
			rank,
			epop: epopMap.get(t.number) ?? null,
			defScore: a && a.defCount > 0 ? a.defSum / a.defCount : null,
			passScore: a && a.passCount > 0 ? a.passSum / a.passCount : null,
			defRate: a && a.total > 0 ? a.defCount / a.total : 0,
			passRate: a && a.total > 0 ? a.passCount / a.total : 0,
		};
	});

	// Sort by rank (nulls last), then team number
	teamStats.sort((a, b) => {
		const ar = a.rank ?? Infinity;
		const br = b.rank ?? Infinity;
		if (ar !== br) return ar - br;
		return a.number - b.number;
	});

	// Load alliance state
	const raw = await getEventSetting('allianceSelection');
	let alliances: (number | null)[][] = Array.from({ length: 8 }, () => [null, null, null, null]);
	let version = 0;
	if (raw) {
		try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed.alliances)) { alliances = parsed.alliances; version = parsed.version ?? 0; }
		} catch { /* use defaults */ }
	}

	return { teams: teamStats, alliances, version, isAdmin: locals.admin };
}
