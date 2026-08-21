import type { MatchType } from '$lib/types';

export interface TBATeamSimple {
	key: string;
	team_number: number;
	nickname: string;
	name: string;
	city: string | null;
	state_prov: string | null;
	country: string | null;
}

export interface TBAOprs {
	oprs: Record<string, number>;
	dprs: Record<string, number>;
	ccwms: Record<string, number>;
}

export interface TBARankings {
	rankings: Array<{
		team_key: string;
		rank: number;
		sort_orders: number[];
	}>;
}

export type TBACOPRs = Record<string, Record<string, number>>;

export interface TBAMatchSimple {
	key: string;
	comp_level: string; // 'qm' | 'pr' | 'ef' | 'qf' | 'sf' | 'f'
	set_number: number;
	match_number: number;
	alliances: {
		red: { team_keys: string[]; score: number };
		blue: { team_keys: string[]; score: number };
	};
	event_key: string;
	time: number | null;
}

export function compLevelToMatchType(compLevel: string): MatchType {
	if (compLevel === 'pr') return 'practice';
	if (compLevel === 'qm') return 'qualification';
	return 'playoff';
}

/** Convert a TBA team key like "frc2718" to team number 2718 */
export function tbaTeamKeyToNumber(key: string): number {
	return parseInt(key.replace(/^frc/i, ''), 10);
}

/** Build our local match ID from a TBA match (e.g. "qm1", "pr1", "sf1m2") */
export function tbaMatchToLocalId(m: TBAMatchSimple): string {
	if (m.comp_level === 'qm' || m.comp_level === 'pr') {
		return `${m.comp_level}${m.match_number}`;
	}
	// Playoff: include set number to disambiguate (e.g. sf1m1, qf2m1)
	return `${m.comp_level}${m.set_number}m${m.match_number}`;
}

const BASE_URL = 'https://www.thebluealliance.com/api/v3';

function getHeaders(apiKey: string): HeadersInit {
	return { 'X-TBA-Auth-Key': apiKey.trim() };
}

/**
 * Fetches simple team list for an event from TBA.
 */
export async function fetchTbaTeams(eventKey: string, apiKey: string): Promise<TBATeamSimple[]> {
	const res = await fetch(`${BASE_URL}/event/${eventKey}/teams/simple`, {
		headers: getHeaders(apiKey)
	});
	if (!res.ok) {
		throw new Error(`TBA teams API returned HTTP ${res.status}: ${await res.text()}`);
	}
	return await res.json();
}

/**
 * Fetches OPR, DPR, CCWM data for an event from TBA.
 */
export async function fetchTbaOprs(eventKey: string, apiKey: string): Promise<TBAOprs | null> {
	const res = await fetch(`${BASE_URL}/event/${eventKey}/oprs`, {
		headers: getHeaders(apiKey)
	});
	if (res.status === 404) return null;
	if (!res.ok) {
		throw new Error(`TBA OPRs API returned HTTP ${res.status}`);
	}
	return await res.json();
}

/**
 * Fetches event rankings from TBA.
 */
export async function fetchTbaRankings(
	eventKey: string,
	apiKey: string
): Promise<TBARankings | null> {
	const res = await fetch(`${BASE_URL}/event/${eventKey}/rankings`, {
		headers: getHeaders(apiKey)
	});
	if (res.status === 404) return null;
	if (!res.ok) {
		throw new Error(`TBA rankings API returned HTTP ${res.status}`);
	}
	return await res.json();
}

/**
 * Fetches component OPRs (COPRs) from TBA.
 */
export async function fetchTbaCoprs(eventKey: string, apiKey: string): Promise<TBACOPRs | null> {
	const res = await fetch(`${BASE_URL}/event/${eventKey}/coprs`, {
		headers: getHeaders(apiKey)
	});
	if (res.status === 404) return null;
	if (!res.ok) {
		throw new Error(`TBA COPRs API returned HTTP ${res.status}`);
	}
	return await res.json();
}

/**
 * Fetches simple match schedule and scores from TBA.
 */
export async function fetchTbaMatches(eventKey: string, apiKey: string): Promise<TBAMatchSimple[]> {
	const res = await fetch(`${BASE_URL}/event/${eventKey}/matches/simple`, {
		headers: getHeaders(apiKey)
	});
	if (res.status === 404) return [];
	if (!res.ok) {
		throw new Error(`TBA matches API returned HTTP ${res.status}`);
	}
	return await res.json();
}
