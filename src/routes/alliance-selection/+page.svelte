<script lang="ts">
	let { data } = $props();

	// ── Alliance state ────────────────────────────────────────────
	let alliances = $state<(number | null)[][]>(data.alliances.map((a) => [...a]));
	let version = $state(data.version);
	let selectedTeam = $state<number | null>(null);
	let saving = $state(false);
	let confirmResetOpen = $state(false);

	// ── Pareto chart state ────────────────────────────────────────
	type Metric = 'def' | 'pass';
	let metric = $state<Metric>('def');
	let hoverTeam = $state<number | null>(null);

	// ── Search ────────────────────────────────────────────────────
	let searchQuery = $state('');

	// ── Derived: set of all chosen team numbers ───────────────────
	const chosenSet = $derived(new Set(alliances.flat().filter((n): n is number => n != null)));

	// ── Derived: unchosen teams sorted by rank ────────────────────
	const unchosenTeams = $derived(data.teams.filter((t) => !chosenSet.has(t.number)));

	// ── Filtered teams (search) ───────────────────────────────────
	const filteredTeams = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return unchosenTeams;
		return unchosenTeams.filter(
			(t) => String(t.number).includes(q) || t.name.toLowerCase().includes(q)
		);
	});

	// ── Pareto front computation ──────────────────────────────────
	// T is excluded only if some U beats it by > epsilon in BOTH axes,
	// so teams with small measurement-error gaps still appear on the front.
	const PARETO_EPOP_EPS = 10;    // ePOP units
	const PARETO_SCORE_EPS = 0.3; // 1–5 scale

	function computePareto(teams: typeof data.teams, m: Metric) {
		const eligible = teams.filter(
			(t) => t.epop != null && (m === 'def' ? t.defScore : t.passScore) != null
		);
		return eligible.filter((t) => {
			const tx = t.epop!;
			const ty = m === 'def' ? t.defScore! : t.passScore!;
			return !eligible.some((u) => {
				if (u === t) return false;
				const ux = u.epop!;
				const uy = m === 'def' ? u.defScore! : u.passScore!;
				return ux > tx + PARETO_EPOP_EPS && uy > ty + PARETO_SCORE_EPS;
			});
		});
	}

	const paretoFront = $derived(computePareto(unchosenTeams, metric));

	// Pareto front sorted by y-axis desc for the step-line
	const paretoSorted = $derived(
		[...paretoFront].sort((a, b) => {
			const ay = metric === 'def' ? (a.defScore ?? 0) : (a.passScore ?? 0);
			const by_ = metric === 'def' ? (b.defScore ?? 0) : (b.passScore ?? 0);
			return by_ - ay;
		})
	);

	// ── SVG chart dimensions ──────────────────────────────────────
	const PAD = { top: 20, right: 20, bottom: 40, left: 44 };
	const W = 480;
	const H = 260;
	const chartW = W - PAD.left - PAD.right;
	const chartH = H - PAD.top - PAD.bottom;

	const epopMax = $derived.by(() => {
		const vals = data.teams.map((t) => t.epop ?? 0);
		return Math.max(...vals, 1) * 1.1;
	});
	const epopMin = $derived.by(() => {
		const vals = data.teams.filter((t) => t.epop != null && t.epop > 0).map((t) => t.epop!);
		return vals.length > 0 ? Math.min(...vals) * 0.9 : 1;
	});
	// 5 log-spaced tick values across the x range
	const xTicks = $derived.by(() => {
		const logMin = Math.log(epopMin);
		const logMax = Math.log(epopMax);
		return [0, 1, 2, 3, 4].map((i) => Math.exp(logMin + (i / 4) * (logMax - logMin)));
	});
	const yMax = 5.2;

	function xScale(v: number) {
		const logMin = Math.log(epopMin);
		const logMax = Math.log(epopMax);
		return (Math.log(Math.max(v, epopMin)) - logMin) / (logMax - logMin) * chartW;
	}
	function yScale(v: number) { return chartH - (v / yMax) * chartH; }

	function teamPoint(t: (typeof data.teams)[0]) {
		return {
			x: xScale(t.epop ?? 0),
			y: yScale(metric === 'def' ? (t.defScore ?? 0) : (t.passScore ?? 0))
		};
	}

	// ── Interaction: place/select teams ──────────────────────────
	async function saveAlliances(next: (number | null)[][]) {
		saving = true;
		try {
			const res = await fetch('/api/alliance-selection', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ alliances: next })
			});
			if (res.ok) {
				const data = await res.json();
				version = data.version;
				alliances = next;
			}
		} finally {
			saving = false;
		}
	}

	function clickSlot(allianceIdx: number, slotIdx: number) {
		const occupant = alliances[allianceIdx][slotIdx];

		if (occupant != null) {
			// Select the occupant for moving
			selectedTeam = selectedTeam === occupant ? null : occupant;
			return;
		}

		if (selectedTeam != null) {
			// Place selected team here
			const next = alliances.map((a) => [...a]);
			// Remove from current position if it's already placed
			for (let ai = 0; ai < 8; ai++) {
				for (let si = 0; si < 4; si++) {
					if (next[ai][si] === selectedTeam) next[ai][si] = null;
				}
			}
			next[allianceIdx][slotIdx] = selectedTeam;
			selectedTeam = null;
			saveAlliances(next);
		}
	}

	function clickAvailableTeam(teamNum: number) {
		selectedTeam = selectedTeam === teamNum ? null : teamNum;
	}

	function removeFromAlliance(allianceIdx: number, slotIdx: number) {
		const next = alliances.map((a) => [...a]);
		next[allianceIdx][slotIdx] = null;
		selectedTeam = null;
		saveAlliances(next);
	}

	async function resetAlliances() {
		confirmResetOpen = false;
		saving = true;
		try {
			const res = await fetch('/api/alliance-selection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reset: true }) });
			if (res.ok) {
				const d = await res.json();
				version = d.version;
				alliances = Array.from({ length: 8 }, () => [null, null, null, null]);
				selectedTeam = null;
			}
		} finally {
			saving = false;
		}
	}

	// ── Live polling ──────────────────────────────────────────────
	$effect(() => {
		const id = setInterval(async () => {
			if (saving) return;
			try {
				const res = await fetch('/api/alliance-selection');
				if (!res.ok) return;
				const d = await res.json();
				if (d.version !== version) {
					alliances = d.alliances;
					version = d.version;
				}
			} catch { /* ignore network errors */ }
		}, 2000);
		return () => clearInterval(id);
	});

	// Helper: look up team by number
	function teamInfo(num: number | null) {
		if (num == null) return null;
		return data.teams.find((t) => t.number === num) ?? null;
	}

	function fmt1(v: number | null) { return v != null ? v.toFixed(1) : '—'; }
	function fmtPct(v: number) { return Math.round(v * 100) + '%'; }

	// ── ePOP coloring (percentile-based, same as /teams) ──────────
	const epopSorted = $derived(
		data.teams.filter((t) => t.epop != null).map((t) => t.epop!).sort((a, b) => a - b)
	);
	function epopPct(epop: number | null): number | null {
		if (epop == null || epopSorted.length === 0) return null;
		const below = epopSorted.filter((v) => v < epop).length;
		return (below / epopSorted.length) * 100;
	}
	function epopColorClass(epop: number | null): string {
		const pct = epopPct(epop);
		if (pct == null) return 'text-gray-300';
		if (pct < 33.33) return 'text-red-600 font-bold';
		if (pct < 66.67) return 'text-gray-700 font-bold';
		if (pct < 90) return 'text-green-700 font-bold';
		return 'text-blue-700 font-bold';
	}

	// ── Snake draft order: fill slots 0+1 per alliance (1→8), then slot 2 (8→1), slot 3 (1→8) ──
	const SNAKE_ORDER: [number, number][] = [
		...[0,1,2,3,4,5,6,7].flatMap((ai): [number, number][] => [[ai, 0], [ai, 1]]),
		...[7,6,5,4,3,2,1,0].map((ai): [number, number] => [ai, 2]),
		...[0,1,2,3,4,5,6,7].map((ai): [number, number] => [ai, 3]),
	];

	function nextSnakeSlot(): [number, number] | null {
		for (const [ai, si] of SNAKE_ORDER) {
			if (alliances[ai][si] == null) return [ai, si];
		}
		return null;
	}

	function quickAddTeam(teamNum: number) {
		const slot = nextSnakeSlot();
		if (slot == null) return;
		const [ai, si] = slot;
		const next = alliances.map((a) => [...a]);
		for (let a = 0; a < 8; a++)
			for (let s = 0; s < 4; s++)
				if (next[a][s] === teamNum) next[a][s] = null;
		next[ai][si] = teamNum;
		selectedTeam = null;
		saveAlliances(next);
	}
</script>

<div class="mx-auto max-w-screen-xl px-4 py-6">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<div class="flex items-center gap-3">
				<h1 class="text-3xl font-black tracking-tight text-gray-900">Alliance Selection</h1>
				<button
					onclick={() => (confirmResetOpen = true)}
					class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
				>
					Reset
				</button>
			</div>
			<p class="mt-1 text-sm text-gray-500">
				{chosenSet.size} of {data.teams.length} teams placed
				{#if saving}<span class="ml-2 text-blue-500">Saving…</span>{/if}
			</p>
		</div>
	</div>

	<!-- Alliance boards: 2×4 grid of 8 alliances -->
	<div class="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
		{#each alliances as alliance, ai}
			<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-100 bg-gray-50 px-3 py-2">
					<span class="text-xs font-bold tracking-wider text-gray-500 uppercase">Alliance {ai + 1}</span>
				</div>
				<div class="p-2 space-y-1.5">
					{#each alliance as occupant, si}
						{@const info = teamInfo(occupant)}
						{@const isSelected = occupant === selectedTeam}
						{#if occupant != null}
							<!-- Occupied slot -->
							<div class="flex items-center gap-1 rounded-lg border {isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'} px-2 py-1.5">
								<button
									onclick={() => clickSlot(ai, si)}
									class="min-w-0 flex-1 text-left"
									title="Click to select for moving"
								>
									<span class="block font-bold text-sm {isSelected ? 'text-blue-700' : 'text-gray-800'}">{occupant}</span>
									{#if info}
										<span class="block truncate text-[11px] text-gray-500">{info.name}</span>
									{/if}
								</button>
								<button
									onclick={() => removeFromAlliance(ai, si)}
									class="shrink-0 rounded p-0.5 text-gray-300 hover:text-red-500"
									title="Remove"
								>
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
									</svg>
								</button>
							</div>
						{:else}
							<!-- Empty slot -->
							<button
								onclick={() => clickSlot(ai, si)}
								class="w-full rounded-lg border-2 border-dashed px-2 py-1.5 text-left text-xs transition-colors
									{selectedTeam != null
										? 'border-blue-300 bg-blue-50 text-blue-400 hover:bg-blue-100'
										: 'border-gray-200 text-gray-300 hover:border-gray-300'}"
							>
								{selectedTeam != null ? '→ Place here' : 'Empty'}
							</button>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Bottom section: Pareto chart + Available teams -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">

		<!-- Left: Pareto chart -->
		<div class="rounded-xl border border-gray-200 bg-white shadow-sm">
			<div class="border-b border-gray-100 px-4 py-3">
				<div class="flex items-center justify-between">
					<h2 class="font-bold text-gray-900">Pareto Front</h2>
					<div class="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
						<button
							onclick={() => (metric = 'def')}
							class="px-3 py-1.5 transition-colors {metric === 'def' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}"
						>ePOP vs Defense</button>
						<button
							onclick={() => (metric = 'pass')}
							class="px-3 py-1.5 transition-colors {metric === 'pass' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}"
						>ePOP vs Passing</button>
					</div>
				</div>
				<p class="mt-1 text-xs text-gray-400">
					{paretoFront.length} team{paretoFront.length !== 1 ? 's' : ''} on front · {unchosenTeams.length} teams remaining
				</p>
			</div>

			<div class="p-3">
				<!-- SVG scatter plot -->
				<svg viewBox="0 0 {W} {H}" class="w-full" role="img" aria-label="Pareto front scatter plot">
					<g transform="translate({PAD.left},{PAD.top})">
						<!-- Grid lines -->
						{#each [1, 2, 3, 4, 5] as y}
							<line
								x1="0" y1={yScale(y)} x2={chartW} y2={yScale(y)}
								stroke="#f3f4f6" stroke-width="1"
							/>
							<text x="-6" y={yScale(y) + 4} text-anchor="end" font-size="10" fill="#9ca3af">{y}</text>
						{/each}
						{#each xTicks as xv}
							<line
								x1={xScale(xv)} y1="0" x2={xScale(xv)} y2={chartH}
								stroke="#f3f4f6" stroke-width="1"
							/>
							<text x={xScale(xv)} y={chartH + 14} text-anchor="middle" font-size="10" fill="#9ca3af">
								{xv.toFixed(0)}
							</text>
						{/each}

						<!-- Axes -->
						<line x1="0" y1={chartH} x2={chartW} y2={chartH} stroke="#d1d5db" stroke-width="1"/>
						<line x1="0" y1="0" x2="0" y2={chartH} stroke="#d1d5db" stroke-width="1"/>

						<!-- Axis labels -->
						<text x={chartW / 2} y={chartH + 32} text-anchor="middle" font-size="11" fill="#6b7280">ePOP</text>
						<text
							transform="rotate(-90)"
							x={-(chartH / 2)}
							y="-34"
							text-anchor="middle"
							font-size="11"
							fill="#6b7280"
						>{metric === 'def' ? 'Defense' : 'Passing'} (1–5)</text>

						<!-- Data points: all unchosen, pareto front on top -->
						{#each unchosenTeams as t}
							{#if t.epop != null && (metric === 'def' ? t.defScore : t.passScore) != null}
								{@const pt = teamPoint(t)}
								{@const onFront = paretoFront.includes(t)}
								<circle
									cx={pt.x} cy={pt.y}
									r={onFront ? 6 : 4}
									fill={onFront ? '#f59e0b' : '#3b82f6'}
									opacity={onFront ? 1 : 0.6}
									stroke={hoverTeam === t.number ? '#1d4ed8' : 'none'}
									stroke-width="2"
									class="cursor-pointer"
									onmouseenter={() => (hoverTeam = t.number)}
									onmouseleave={() => (hoverTeam = null)}
									role="img"
									aria-label="Team {t.number}"
								/>
								{#if onFront || hoverTeam === t.number}
									<text
										x={pt.x + 7} y={pt.y + 4}
										font-size="10"
										font-weight={onFront ? '700' : '400'}
										fill={onFront ? '#b45309' : '#1d4ed8'}
									>{t.number}</text>
								{/if}
							{/if}
						{/each}

						<!-- Chosen teams (faded) -->
						{#each data.teams.filter((t) => chosenSet.has(t.number)) as t}
							{#if t.epop != null && (metric === 'def' ? t.defScore : t.passScore) != null}
								{@const pt = teamPoint(t)}
								<circle cx={pt.x} cy={pt.y} r="3" fill="#d1d5db" opacity="0.5"/>
							{/if}
						{/each}
					</g>
				</svg>

				<!-- Legend -->
				<div class="mt-1 flex items-center gap-4 px-1 text-xs text-gray-500">
					<span class="flex items-center gap-1.5"><span class="inline-block h-3 w-3 rounded-full bg-amber-400"></span>Pareto front</span>
					<span class="flex items-center gap-1.5"><span class="inline-block h-3 w-3 rounded-full bg-blue-500 opacity-60"></span>Available</span>
					<span class="flex items-center gap-1.5"><span class="inline-block h-3 w-3 rounded-full bg-gray-300"></span>Chosen</span>
				</div>
			</div>

			<!-- Pareto front table -->
			{#if paretoSorted.length > 0}
				<div class="border-t border-gray-100">
					<div class="px-4 py-2">
						<p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pareto Front Teams</p>
						<table class="w-full text-xs">
							<thead>
								<tr class="text-left text-gray-400">
									<th class="pb-1 font-medium">Rank</th>
									<th class="pb-1 font-medium">Team</th>
									<th class="pb-1 font-medium">ePOP</th>
									<th class="pb-1 font-medium">Def</th>
									<th class="pb-1 font-medium">Pass</th>
								</tr>
							</thead>
							<tbody>
								{#each paretoSorted as t}
									<tr class="border-t border-gray-50 hover:bg-gray-50">
										<td class="py-1 font-bold text-gray-400">{t.rank != null ? `#${t.rank}` : '—'}</td>
										<td class="py-1">
											<a
												href="/teams/{t.number}?from=alliance-selection"
												class="font-bold text-blue-600 hover:underline"
											>{t.number}</a>
											<!-- <span class="ml-1 text-gray-500 truncate">{t.name}</span> -->
										</td>
										<td class="py-1 font-semibold {epopColorClass(t.epop)}">{fmt1(t.epop)}</td>
										<td class="py-1 {metric === 'def' ? 'font-bold text-gray-800' : 'text-gray-500'}">{fmt1(t.defScore)}</td>
										<td class="py-1 {metric === 'pass' ? 'font-bold text-gray-800' : 'text-gray-500'}">{fmt1(t.passScore)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>

		<!-- Right: Available teams table -->
		<div class="rounded-xl border border-gray-200 bg-white shadow-sm">
			<div class="border-b border-gray-100 px-4 py-3">
				<h2 class="font-bold text-gray-900">Available Teams</h2>
				<p class="mt-0.5 text-xs text-gray-400">
					Click a team to select it, then click an alliance slot to place them.
				</p>
			</div>
			<!-- Search bar -->
			<div class="border-b border-gray-100 px-3 py-2">
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Search by # or name…"
					class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
				/>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-100 bg-gray-50 text-left text-xs font-bold tracking-wider text-gray-400 uppercase">
							<th class="px-2 py-2"></th>
							<th class="px-2 py-2">Rank</th>
							<th class="px-2 py-2">Team</th>
							<th class="px-2 py-2">ePOP</th>
							<th class="px-2 py-2" title="Defense: avg score / rate">Def</th>
							<th class="px-2 py-2" title="Passing: avg score / rate">Pass</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredTeams as t, i}
							{@const onFront = paretoFront.includes(t)}
							{@const isSelected = t.number === selectedTeam}
							<tr
								class="cursor-pointer border-b border-gray-50 transition-colors
									{isSelected ? 'bg-blue-50' : onFront ? 'bg-amber-50 hover:bg-amber-100' : i % 2 === 1 ? 'bg-gray-50/40 hover:bg-blue-50' : 'hover:bg-blue-50'}"
								onclick={() => clickAvailableTeam(t.number)}
							>
								<td class="px-2 py-1.5">
									<button
										onclick={(e) => { e.stopPropagation(); quickAddTeam(t.number); }}
										class="flex items-center justify-center rounded w-6 h-6 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700"
										title="Quick add to next snake slot"
									>+</button>
								</td>
								<td class="px-2 py-1.5 font-bold text-gray-400 text-xs whitespace-nowrap">{t.rank != null ? `#${t.rank}` : '—'}</td>
								<td class="px-2 py-1.5">
									<a
										href="/teams/{t.number}?from=alliance-selection"
										onclick={(e) => e.stopPropagation()}
										class="font-black text-blue-600 hover:underline leading-tight"
									>{t.number}</a>
									<div class="text-[11px] text-gray-500 leading-tight truncate max-w-[110px]">{t.name}</div>
								</td>
								<td class="px-2 py-1.5 text-xs whitespace-nowrap {epopColorClass(t.epop)}">{fmt1(t.epop)}</td>
								<td class="px-2 py-1.5 text-gray-600 text-xs whitespace-nowrap">
									{#if t.defScore != null}
										<span class="font-semibold">{fmt1(t.defScore)}</span>
										<span class="text-gray-400 text-[10px]"> {fmtPct(t.defRate)}</span>
									{:else}
										<span class="text-gray-300">—</span>
									{/if}
								</td>
								<td class="px-2 py-1.5 text-gray-600 text-xs whitespace-nowrap">
									{#if t.passScore != null}
										<span class="font-semibold">{fmt1(t.passScore)}</span>
										<span class="text-gray-400 text-[10px]"> {fmtPct(t.passRate)}</span>
									{:else}
										<span class="text-gray-300">—</span>
									{/if}
								</td>
							</tr>
						{/each}
						{#if filteredTeams.length === 0}
							<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">
								{searchQuery ? 'No teams match your search.' : 'All teams have been placed.'}
							</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<!-- Reset confirmation modal -->
{#if confirmResetOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="reset-dialog-title"
	>
		<div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
			<h2 id="reset-dialog-title" class="text-lg font-bold text-gray-900">Reset Alliance Selection?</h2>
			<p class="mt-2 text-sm text-gray-500">
				This will clear all {chosenSet.size} team placement{chosenSet.size !== 1 ? 's' : ''} and cannot be undone. All users on this page will see the reset immediately.
			</p>
			<div class="mt-5 flex justify-end gap-3">
				<button
					onclick={() => (confirmResetOpen = false)}
					class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					onclick={resetAlliances}
					class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
				>
					Reset
				</button>
			</div>
		</div>
	</div>
{/if}
