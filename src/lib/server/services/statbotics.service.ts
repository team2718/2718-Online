interface StatboticsTeamEvent {
	team: number;
	epa?: {
		breakdown?: {
			total_points?: number;
			auto_points?: number;
			teleop_points?: number;
			endgame_points?: number;
		};
	};
}

/**
 * Fetches team EPAs from the Statbotics v3 API for a given FRC event.
 * Returns a map of teamNumber -> EPA points.
 */
export async function fetchStatboticsEpa(eventKey: string): Promise<Record<number, number>> {
	const epaByTeam: Record<number, number> = {};

	try {
		const res = await fetch(
			`https://api.statbotics.io/v3/team_events?event=${encodeURIComponent(eventKey)}`
		);
		if (res.status === 404) return epaByTeam;
		if (!res.ok) {
			console.warn(`[Statbotics] API returned HTTP ${res.status}`);
			return epaByTeam;
		}

		const entries: StatboticsTeamEvent[] = await res.json();
		for (const entry of entries) {
			const total = entry.epa?.breakdown?.total_points;
			if (typeof total === 'number') {
				epaByTeam[entry.team] = total;
			}
		}
	} catch (err) {
		console.warn('[Statbotics] Error fetching EPAs:', err);
	}

	return epaByTeam;
}
