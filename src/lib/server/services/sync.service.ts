import { db } from '$lib/server/db';
import { matches, teams } from '$lib/server/db/schema';
import {
	fetchTbaTeams,
	fetchTbaOprs,
	fetchTbaRankings,
	fetchTbaCoprs,
	fetchTbaMatches,
	compLevelToMatchType,
	tbaTeamKeyToNumber,
	tbaMatchToLocalId,
	type TBATeamSimple,
	type TBAMatchSimple
} from './tba.service';
import { fetchStatboticsEpa } from './statbotics.service';
import { invalidateEpopCache } from '$lib/server/epop';
import { setEventSetting } from './settings.service';

export interface SyncResult {
	teamsInserted: number;
	matchesInserted: number;
	matchesSkipped: boolean;
	errors: string[];
}

/**
 * Synchronizes event data from The Blue Alliance and Statbotics into the local database.
 * Executes database operations atomically within a transaction.
 */
export async function syncEventData(
	eventKey: string,
	apiKey: string,
	skipMatches = false
): Promise<SyncResult> {
	const errors: string[] = [];
	let teamsInserted = 0;
	let matchesInserted = 0;

	if (!eventKey) {
		return {
			teamsInserted: 0,
			matchesInserted: 0,
			matchesSkipped: skipMatches,
			errors: ['No event key provided']
		};
	}

	// Persist the event key in settings
	await setEventSetting('eventCode', eventKey);

	// Fetch all data in parallel
	let tbaTeams: TBATeamSimple[] = [];
	let oprData = null;
	let rankingsData = null;
	let coprsData = null;
	let statboticsEpa: Record<number, number> = {};

	try {
		tbaTeams = await fetchTbaTeams(eventKey, apiKey);
	} catch (e) {
		errors.push(`Failed to fetch TBA teams: ${String(e)}`);
	}

	try {
		oprData = await fetchTbaOprs(eventKey, apiKey);
	} catch (e) {
		errors.push(`Failed to fetch TBA OPRs: ${String(e)}`);
	}

	try {
		rankingsData = await fetchTbaRankings(eventKey, apiKey);
	} catch (e) {
		errors.push(`Failed to fetch TBA rankings: ${String(e)}`);
	}

	try {
		coprsData = await fetchTbaCoprs(eventKey, apiKey);
	} catch (e) {
		errors.push(`Failed to fetch TBA COPRs: ${String(e)}`);
	}

	try {
		statboticsEpa = await fetchStatboticsEpa(eventKey);
	} catch (e) {
		errors.push(`Failed to fetch Statbotics EPA: ${String(e)}`);
	}

	// Build rankings lookup
	const rankingScoreByTeam: Record<string, number> = {};
	const rankByTeam: Record<string, number> = {};
	if (rankingsData?.rankings) {
		for (const r of rankingsData.rankings) {
			if (r.sort_orders && r.sort_orders.length > 0) {
				rankingScoreByTeam[r.team_key] = r.sort_orders[0];
			}
			rankByTeam[r.team_key] = r.rank;
		}
	}

	// Batch upsert teams in transaction
	if (tbaTeams.length > 0) {
		await db.transaction(async (tx) => {
			for (const t of tbaTeams) {
				try {
					const tbaKey = `frc${t.team_number}`;
					const metadata: Record<string, unknown> = {
						...(t as unknown as Record<string, unknown>),
						...(oprData
							? {
									opr: oprData.oprs?.[tbaKey] ?? null,
									dpr: oprData.dprs?.[tbaKey] ?? null,
									ccwm: oprData.ccwms?.[tbaKey] ?? null
								}
							: {}),
						ranking_score: rankingScoreByTeam[tbaKey] ?? null,
						rank: rankByTeam[tbaKey] ?? null,
						hub_total_fuel_count_copr: coprsData?.['Hub Total Fuel Count']?.[tbaKey] ?? null,
						statboticsEpa: statboticsEpa[t.team_number] ?? null
					};

					await tx
						.insert(teams)
						.values({
							number: t.team_number,
							name: t.nickname ?? t.name ?? `Team ${t.team_number}`,
							metadata
						})
						.onConflictDoUpdate({
							target: teams.number,
							set: {
								name: t.nickname ?? t.name ?? `Team ${t.team_number}`,
								metadata
							}
						})
						.run();

					teamsInserted++;
				} catch (e) {
					errors.push(`Failed to upsert team ${t.team_number}: ${String(e)}`);
				}
			}
		});
	}

	// Fetch and batch upsert matches in transaction (unless practice mode skips TBA match schedule)
	if (!skipMatches) {
		let tbaMatches: TBAMatchSimple[] = [];
		try {
			tbaMatches = await fetchTbaMatches(eventKey, apiKey);
		} catch (e) {
			errors.push(`Failed to fetch TBA matches: ${String(e)}`);
		}

		if (tbaMatches.length > 0) {
			await db.transaction(async (tx) => {
				for (const m of tbaMatches) {
					try {
						const localId = tbaMatchToLocalId(m);
						const matchType = compLevelToMatchType(m.comp_level);
						const [red1, red2, red3] = m.alliances.red.team_keys.map(tbaTeamKeyToNumber);
						const [blue1, blue2, blue3] = m.alliances.blue.team_keys.map(tbaTeamKeyToNumber);

						const redScore = m.alliances.red.score >= 0 ? m.alliances.red.score : null;
						const blueScore = m.alliances.blue.score >= 0 ? m.alliances.blue.score : null;

						await tx
							.insert(matches)
							.values({
								id: localId,
								matchNumber: m.match_number,
								matchType,
								red1: red1 ?? null,
								red2: red2 ?? null,
								red3: red3 ?? null,
								blue1: blue1 ?? null,
								blue2: blue2 ?? null,
								blue3: blue3 ?? null,
								redScore,
								blueScore
							})
							.onConflictDoUpdate({
								target: matches.id,
								set: {
									matchType,
									red1: red1 ?? null,
									red2: red2 ?? null,
									red3: red3 ?? null,
									blue1: blue1 ?? null,
									blue2: blue2 ?? null,
									blue3: blue3 ?? null,
									redScore,
									blueScore
								}
							})
							.run();

						matchesInserted++;
					} catch (e) {
						errors.push(`Failed to upsert match ${m.key}: ${String(e)}`);
					}
				}
			});
		}
	}

	// Invalidate ePOP cache since team metadata / match scores may have updated
	invalidateEpopCache();

	return {
		teamsInserted,
		matchesInserted,
		matchesSkipped: skipMatches,
		errors
	};
}
