/**
 * ePOP (e'POssum Power) — scouting-informed OPR
 *
 * Solves the regularized, time-decay-weighted least squares system:
 *   (M'WM + λI) · x = M'Wy + λ·priors
 *
 * where priors are derived from scouting Likert scores, providing a
 * meaningful signal in early matches before sufficient OPR data exists.
 *
 * Algorithm ported from opr_with_regularization_cleaned.m
 */

import { db } from '$lib/server/db';
import { matches, teams, scoutingReports } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// --- Hyperparameters ---
const LAMBDA = 1.5; // Regularization strength (0 = raw OPR)
const GAMMA = 1.5; // Power law exponent for scouting prior scaling
const DECAY = 0.98; // Per-match time-decay factor (1.0 = no decay)

// --- Linear Algebra ---

/** Solve Ax = b via Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]): number[] {
	const n = A.length;
	const M = A.map((row, i) => [...row, b[i]]);

	for (let col = 0; col < n; col++) {
		let maxRow = col;
		for (let row = col + 1; row < n; row++) {
			if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
		}
		[M[col], M[maxRow]] = [M[maxRow], M[col]];

		const pivot = M[col][col];
		if (Math.abs(pivot) < 1e-12) continue;

		for (let row = col + 1; row < n; row++) {
			const factor = M[row][col] / pivot;
			for (let k = col; k <= n; k++) M[row][k] -= factor * M[col][k];
		}
	}

	const x = new Array(n).fill(0);
	for (let row = n - 1; row >= 0; row--) {
		x[row] = M[row][n];
		for (let k = row + 1; k < n; k++) x[row] -= M[row][k] * x[k];
		x[row] /= M[row][row] || 1;
	}
	return x;
}

// --- Types ---

export interface EpopHistoryPoint {
	matchId: string;
	matchNumber: number;
	/** teamNumber → ePOP at this point in time */
	values: Map<number, number>;
}

interface EpopResult {
	/** Final ePOP values after all scored matches */
	values: Map<number, number>;
	/** ePOP state after each scored qualification match */
	history: EpopHistoryPoint[];
}

// --- Core Algorithm ---

/**
 * Run the full incremental ePOP loop over all scored qualification matches.
 * Mirrors the MATLAB prototype: at each match k, scouting priors are built
 * from reports available up to that match, and decay weights are relative to k.
 */
async function computeEpopFull(): Promise<EpopResult> {
	const [allTeams, qualMatches, allReports] = await Promise.all([
		db.select({ number: teams.number }).from(teams).all(),
		db.select().from(matches).where(eq(matches.matchType, 'qualification')).all(),
		db
			.select({
				matchId: scoutingReports.matchId,
				teamNumber: scoutingReports.teamNumber,
				data: scoutingReports.data
			})
			.from(scoutingReports)
			.all()
	]);

	const scoredMatches = qualMatches
		.filter((m) => m.redScore != null && m.blueScore != null)
		.sort((a, b) => a.matchNumber - b.matchNumber);

	if (scoredMatches.length === 0 || allTeams.length === 0) {
		return { values: new Map(), history: [] };
	}

	const teamNums = allTeams.map((t) => t.number).sort((a, b) => a - b);
	const n = teamNums.length;
	const teamIdx = new Map<number, number>(teamNums.map((t, i) => [t, i]));

	// matchId → chronological index among scored matches (for report gating)
	const matchIdxById = new Map<string, number>(scoredMatches.map((m, i) => [m.id, i]));

	// Pre-extract scouting scores from reports that belong to scored qual matches
	const rptScores: { teamNumber: number; matchIdx: number; score: number }[] = [];
	for (const r of allReports) {
		const idx = matchIdxById.get(r.matchId);
		if (idx === undefined || !r.data) continue;
		const rate = Number(r.data.teleFuelRateScore);
		const acc = Number(r.data.teleAccScore);
		if (!rate || !acc) continue;
		rptScores.push({ teamNumber: r.teamNumber, matchIdx: idx, score: Math.sqrt(rate * acc) });
	}

	const K = scoredMatches.length;
	// Design matrix rows and score vector — grown incrementally
	const matrixRows: number[][] = [];
	const yVec: number[] = [];

	const history: EpopHistoryPoint[] = [];
	let finalValues = new Map<number, number>();

	for (let k = 0; k < K; k++) {
		const m = scoredMatches[k];

		// Append design matrix rows for match k
		const redRow = new Array(n).fill(0);
		for (const t of [m.red1, m.red2, m.red3]) {
			if (t == null) continue;
			const ti = teamIdx.get(t);
			if (ti !== undefined) redRow[ti] = 1;
		}
		const blueRow = new Array(n).fill(0);
		for (const t of [m.blue1, m.blue2, m.blue3]) {
			if (t == null) continue;
			const ti = teamIdx.get(t);
			if (ti !== undefined) blueRow[ti] = 1;
		}
		matrixRows.push(redRow, blueRow);
		yVec.push(m.redScore!, m.blueScore!);

		// --- Scouting priors: only reports from matches 0..k ---
		const teamScores = new Map<number, number[]>();
		for (const r of rptScores) {
			if (r.matchIdx > k) continue;
			if (!teamScores.has(r.teamNumber)) teamScores.set(r.teamNumber, []);
			teamScores.get(r.teamNumber)!.push(r.score);
		}
		const allAvail = [...teamScores.values()].flat();
		const globalAvg = allAvail.length > 0 ? allAvail.reduce((s, v) => s + v, 0) / allAvail.length : 1;

		const rawPriors = teamNums.map((num) => {
			const s = teamScores.get(num);
			return s?.length ? s.reduce((a, b) => a + b, 0) / s.length : globalAvg;
		});

		// Scale priors into OPR-point units (MATLAB: avg_opr_estimate * (p/avg_scouting)^gamma)
		const numRows = (k + 1) * 2;
		const avgY = yVec.slice(0, numRows).reduce((s, v) => s + v, 0) / numRows;
		const avgOprEst = avgY / 3;
		const avgRaw = rawPriors.reduce((s, v) => s + v, 0) / n;
		const priors = rawPriors.map((p) =>
			avgRaw > 0 ? avgOprEst * Math.pow(p / avgRaw, GAMMA) : avgOprEst
		);

		// --- Build A = M'WM + λI and b = M'Wy + λ·priors ---
		const A: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
		const bVec: number[] = new Array(n).fill(0);

		for (let row = 0; row < numRows; row++) {
			const w = Math.pow(DECAY, k - Math.floor(row / 2));
			const mRow = matrixRows[row];
			const y = yVec[row];
			for (let i = 0; i < n; i++) {
				if (mRow[i] === 0) continue;
				bVec[i] += w * y;
				for (let j = 0; j < n; j++) {
					if (mRow[j] !== 0) A[i][j] += w * mRow[j];
				}
			}
		}
		for (let i = 0; i < n; i++) {
			A[i][i] += LAMBDA;
			bVec[i] += LAMBDA * priors[i];
		}

		const epopVals = solve(A, bVec);
		const stepMap = new Map<number, number>(teamNums.map((t, i) => [t, epopVals[i]]));
		history.push({ matchId: m.id, matchNumber: m.matchNumber, values: stepMap });
		finalValues = stepMap;
	}

	return { values: finalValues, history };
}

// --- Cache ---

interface EpopCache {
	fingerprint: string;
	values: Map<number, number>;
	history: EpopHistoryPoint[];
}

let cache: EpopCache | null = null;

async function getFingerprint(): Promise<string> {
	const [mc, rc] = await Promise.all([
		db
			.select({ id: matches.id, s: matches.redScore })
			.from(matches)
			.where(eq(matches.matchType, 'qualification'))
			.all()
			.then((rows) => rows.filter((r) => r.s != null).length),
		db
			.select({ id: scoutingReports.id })
			.from(scoutingReports)
			.all()
			.then((r) => r.length)
	]);
	return `${mc}:${rc}`;
}

async function ensureCache(): Promise<EpopCache> {
	const fp = await getFingerprint();
	if (cache?.fingerprint === fp) return cache;
	const { values, history } = await computeEpopFull();
	cache = { fingerprint: fp, values, history };
	return cache;
}

/**
 * Get the current ePOP values for all teams.
 * Cached until new scored matches or scouting reports are recorded.
 */
export async function getEpop(): Promise<Map<number, number>> {
	return (await ensureCache()).values;
}

/**
 * Get the ePOP history for a single team — one point per scored qualification match.
 * Returns `[]` if no history is available yet.
 */
export async function getEpopHistory(
	teamNumber: number
): Promise<Array<{ matchNumber: number; epop: number }>> {
	const { history } = await ensureCache();
	return history.map((h) => ({ matchNumber: h.matchNumber, epop: h.values.get(teamNumber) ?? 0 }));
}

/**
 * Get the ePOP values computed just before the given match number.
 * Uses the last history snapshot whose matchNumber is strictly less than
 * `matchNumber`, enabling historical accuracy comparisons on the prematch page.
 * Returns an empty Map if no earlier scored match exists.
 */
export async function getEpopBeforeMatch(matchNumber: number): Promise<Map<number, number>> {
	const { history } = await ensureCache();
	let best: EpopHistoryPoint | null = null;
	for (const h of history) {
		if (h.matchNumber < matchNumber) best = h;
	}
	return best?.values ?? new Map();
}

/** Invalidate the ePOP cache, forcing a recompute on the next call. */
export function invalidateEpopCache(): void {
	cache = null;
}
