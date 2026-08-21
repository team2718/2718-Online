/**
 * Formats a number to 1 decimal place, returning fallback if null/undefined.
 */
export function fmt1(v: number | null | undefined, fallback = '—'): string {
	if (v == null || isNaN(v)) return fallback;
	return v.toFixed(1);
}

/**
 * Formats a percentage (0..100 or 0..1 depending on `isUnitFraction`).
 */
export function fmtPct(v: number | null | undefined, isUnitFraction = false): string {
	if (v == null || isNaN(v)) return '0%';
	const pct = isUnitFraction ? v * 100 : v;
	return `${Math.round(pct)}%`;
}

/**
 * Returns human-readable climb tier label (0=None, 1=L1, 2=L2, 3=L3).
 */
export function climbLabel(v: number | null | undefined): string {
	return ['None', 'L1', 'L2', 'L3'][v ?? 0] ?? 'None';
}

/**
 * Returns human-readable penalty card label (0=None, 1=Yellow, 2=Red).
 */
export function cardLabel(v: number | null | undefined): string {
	return ['None', 'Yellow', 'Red'][v ?? 0] ?? 'None';
}

/**
 * Returns human-readable starting position label.
 */
export function posLabel(v: number | null | undefined): string {
	return ['L Trench', 'L Bump', 'Center', 'R Bump', 'R Trench'][v ?? 2] ?? '—';
}

/**
 * Returns checkmark or cross for boolean display.
 */
export function yn(v: boolean | null | undefined): string {
	return v ? '✓' : '✗';
}

/**
 * Helper to calculate sparkline SVG X coordinate.
 */
export function sparkX(
	m: number,
	minM: number,
	maxM: number,
	leftPad: number,
	chartWidth: number
): number {
	return leftPad + ((m - minM) / Math.max(maxM - minM, 1)) * chartWidth;
}

/**
 * Helper to calculate sparkline SVG Y coordinate.
 */
export function sparkY(
	v: number,
	rawMin: number,
	rawMax: number,
	vPad: number,
	topPad: number,
	chartHeight: number
): number {
	return topPad + (1 - (v - (rawMin - vPad)) / Math.max(rawMax - rawMin + 2 * vPad, 1)) * chartHeight;
}

