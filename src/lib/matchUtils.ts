export type MatchLike = {
	matchType: string | null;
	matchNumber: number;
	id: string;
};

/** Short badge label: Q36, P3, SF1M2. */
export function matchShortLabel(m: MatchLike): string {
	if (m.matchType === 'qualification') return `Q${m.matchNumber}`;
	if (m.matchType === 'practice') return `P${m.matchNumber}`;
	if (m.matchType === 'playoff') return m.id.toUpperCase();
	return `M${m.matchNumber}`;
}

/** Full human-readable label matching FRC FMS audience display. */
export function matchFullLabel(m: MatchLike): string {
	if (m.matchType === 'qualification') return `Quals ${m.matchNumber}`;
	if (m.matchType === 'practice') return `Practice ${m.matchNumber}`;
	if (m.matchType === 'playoff') {
		const f = m.id.match(/^f(\d+)m(\d+)$/);
		if (f) return `Finals ${f[2]}`;
		const sf = m.id.match(/^sf(\d+)m(\d+)$/);
		if (sf) return `Match ${sf[1]}`;
		return m.id.toUpperCase();
	}
	return `M${m.matchNumber}`;
}

/** Sort key for playoff IDs: semis before finals, then by set, then match. */
export function playoffKey(id: string): number {
	const f = id.match(/^f(\d+)m(\d+)$/);
	if (f) return 100000 + parseInt(f[1]) * 10 + parseInt(f[2]);
	const sf = id.match(/^sf(\d+)m(\d+)$/);
	if (sf) return parseInt(sf[1]) * 10 + parseInt(sf[2]);
	return 99999;
}

/** Tailwind classes for a match type badge (no border). */
export function matchTypeColor(t: string | null): string {
	if (t === 'qualification') return 'text-green-700 bg-green-50';
	if (t === 'practice') return 'text-yellow-700 bg-yellow-50';
	if (t === 'playoff') return 'text-purple-700 bg-purple-50';
	return 'text-gray-600 bg-gray-50';
}

/** Tailwind classes for a match type badge with border. */
export function matchTypeColorBorder(t: string | null): string {
	if (t === 'qualification') return 'text-green-700 bg-green-50 border-green-200';
	if (t === 'practice') return 'text-yellow-700 bg-yellow-50 border-yellow-200';
	if (t === 'playoff') return 'text-purple-700 bg-purple-50 border-purple-200';
	return 'text-gray-600 bg-gray-50 border-gray-200';
}
