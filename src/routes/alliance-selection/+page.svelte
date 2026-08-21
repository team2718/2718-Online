<script lang="ts">
	import { untrack } from 'svelte';
	let { data } = $props();

	// ── Alliance state ────────────────────────────────────────────
	let alliances = $state<(number | null)[][]>(untrack(() => data.alliances.map((a) => [...a])));
	let version = $state(untrack(() => data.version));
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
	const PARETO_EPOP_EPS = 10;
	const PARETO_SCORE_EPS = 0.3;

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

	const paretoSorted = $derived(
		[...paretoFront].sort((a, b) => {
			const ay = metric === 'def' ? (a.defScore ?? 0) : (a.passScore ?? 0);
			const by_ = metric === 'def' ? (b.defScore ?? 0) : (b.passScore ?? 0);
			return by_ - ay;
		})
	);

	// ── SVG chart dimensions ──────────────────────────────────────
	const PAD = { top: 20, right: 25, bottom: 40, left: 44 };
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
	const xTicks = $derived.by(() => {
		const logMin = Math.log(epopMin);
		const logMax = Math.log(epopMax);
		return [0, 1, 2, 3, 4].map((i) => Math.exp(logMin + (i / 4) * (logMax - logMin)));
	});
	const yMax = 5.2;

	function xScale(v: number) {
		const logMin = Math.log(epopMin);
		const logMax = Math.log(epopMax);
		return ((Math.log(Math.max(v, epopMin)) - logMin) / (logMax - logMin)) * chartW;
	}
	function yScale(v: number) {
		return chartH - (v / yMax) * chartH;
	}

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
				const resData = await res.json();
				version = resData.version;
				alliances = next;
			}
		} finally {
			saving = false;
		}
	}

	function clickSlot(allianceIdx: number, slotIdx: number) {
		const occupant = alliances[allianceIdx][slotIdx];

		if (occupant != null) {
			selectedTeam = selectedTeam === occupant ? null : occupant;
			return;
		}

		if (selectedTeam != null) {
			const next = alliances.map((a) => [...a]);
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
			const res = await fetch('/api/alliance-selection', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reset: true })
			});
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
			} catch {
				/* ignore network errors */
			}
		}, 2000);
		return () => clearInterval(id);
	});

	function teamInfo(num: number | null) {
		if (num == null) return null;
		return data.teams.find((t) => t.number === num) ?? null;
	}

	function fmt1(v: number | null) {
		return v != null ? v.toFixed(1) : '—';
	}
	function fmtPct(v: number) {
		return Math.round(v * 100) + '%';
	}

	const epopSorted = $derived(
		data.teams
			.filter((t) => t.epop != null)
			.map((t) => t.epop!)
			.sort((a, b) => a - b)
	);
	function epopPct(epop: number | null): number | null {
		if (epop == null || epopSorted.length === 0) return null;
		const below = epopSorted.filter((v) => v < epop).length;
		return (below / epopSorted.length) * 100;
	}
	function epopColorClass(epop: number | null): string {
		const pct = epopPct(epop);
		if (pct == null) return 'text-slate-400';
		if (pct < 33.33) return 'text-rose-600 dark:text-rose-400 font-bold';
		if (pct < 66.67) return 'text-slate-700 dark:text-slate-300 font-bold';
		if (pct < 90) return 'text-emerald-600 dark:text-emerald-400 font-bold';
		return 'text-cyan-600 dark:text-cyan-400 font-bold';
	}

	const SNAKE_ORDER: [number, number][] = [
		...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((ai): [number, number][] => [
			[ai, 0],
			[ai, 1]
		]),
		...[7, 6, 5, 4, 3, 2, 1, 0].map((ai): [number, number] => [ai, 2]),
		...[0, 1, 2, 3, 4, 5, 6, 7].map((ai): [number, number] => [ai, 3])
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
			for (let s = 0; s < 4; s++) if (next[a][s] === teamNum) next[a][s] = null;
		next[ai][si] = teamNum;
		selectedTeam = null;
		saveAlliances(next);
	}

	const slotLabels = ['Captain', 'Pick 1', 'Pick 2', 'Backup'];
</script>

<div class="mx-auto max-w-7xl space-y-5 sm:space-y-6">
	<!-- Header -->
	<div
		class="flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end dark:border-slate-800/80"
	>
		<div>
			<div class="flex items-center gap-2.5">
				<h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
					Alliance Selection
				</h1>
				<span
					class="rounded-full bg-cyan-50 px-2.5 py-0.5 font-mono text-xs font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
				>
					{chosenSet.size} of {data.teams.length} Placed
				</span>
				{#if saving}
					<span class="font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400"
						>Saving…</span
					>
				{/if}
			</div>
			<p class="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
				Playoff draft board, real-time Pareto frontier analysis, and team selection matrix.
			</p>
		</div>

		<div>
			<button
				onclick={() => (confirmResetOpen = true)}
				class="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 shadow-2xs transition-colors hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
			>
				Reset Alliances
			</button>
		</div>
	</div>

	<!-- 8 Alliance Draft Board Grid (2x4 or 4x2) -->
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
		{#each alliances as alliance, ai}
			<div
				class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
			>
				<div
					class="flex items-center justify-between border-b border-slate-100 bg-slate-50/75 px-3.5 py-2 dark:border-slate-800 dark:bg-slate-800/50"
				>
					<span
						class="font-mono text-xs font-black tracking-wider text-slate-700 uppercase dark:text-slate-200"
					>
						Alliance {ai + 1}
					</span>
					<span class="text-[10px] font-bold text-slate-400">
						{alliance.filter((x) => x != null).length}/4
					</span>
				</div>
				<div class="space-y-1.5 p-2">
					{#each alliance as occupant, si}
						{@const info = teamInfo(occupant)}
						{@const isSelected = occupant === selectedTeam}
						{#if occupant != null}
							<!-- Occupied slot -->
							<div
								class="flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 transition-all
								{isSelected
									? 'border-cyan-500 bg-cyan-50 dark:border-cyan-400 dark:bg-cyan-950/50'
									: 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30'}"
							>
								<button
									onclick={() => clickSlot(ai, si)}
									class="min-w-0 flex-1 text-left"
									title="Click to select for moving"
								>
									<div class="flex items-center gap-1.5">
										<span class="text-[9px] font-bold tracking-wider text-slate-400 uppercase"
											>{slotLabels[si]}:</span
										>
										<span
											class="font-mono text-xs font-black {isSelected
												? 'text-cyan-700 dark:text-cyan-300'
												: 'text-slate-900 dark:text-slate-100'}"
										>
											{occupant}
										</span>
									</div>
									{#if info}
										<p class="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
											{info.name}
										</p>
									{/if}
								</button>
								<button
									onclick={() => removeFromAlliance(ai, si)}
									class="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
									title="Remove from alliance"
								>
									<svg
										class="h-3.5 w-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2.5"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						{:else}
							<!-- Empty slot -->
							<button
								onclick={() => clickSlot(ai, si)}
								class="flex w-full items-center justify-between rounded-xl border border-dashed px-2.5 py-2 text-left text-xs transition-colors
									{selectedTeam != null
									? 'border-cyan-400 bg-cyan-50/60 text-cyan-700 hover:bg-cyan-100/60 dark:border-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300'
									: 'border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-800 dark:text-slate-600'}"
							>
								<span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
									>{slotLabels[si]}</span
								>
								<span class="font-medium">{selectedTeam != null ? '→ Place here' : 'Empty'}</span>
							</button>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Bottom Section: Pareto Scatter Plot + Available Pool -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1.3fr]">
		<!-- Left: Pareto Frontier Scatter Plot -->
		<div class="space-y-3">
			<div
				class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
			>
				<div
					class="flex flex-col justify-between gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center dark:border-slate-800"
				>
					<div>
						<h2 class="text-sm font-bold text-slate-900 dark:text-white">
							Pareto Frontier Analysis
						</h2>
						<p class="text-[11px] text-slate-400">
							{paretoFront.length} optimal teams on frontier · {unchosenTeams.length} available
						</p>
					</div>

					<div
						class="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"
					>
						<button
							onclick={() => (metric = 'def')}
							class="rounded-lg px-2.5 py-1 transition-colors {metric === 'def'
								? 'bg-cyan-600 text-white shadow-2xs'
								: 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}"
						>
							ePOP vs Defense
						</button>
						<button
							onclick={() => (metric = 'pass')}
							class="rounded-lg px-2.5 py-1 transition-colors {metric === 'pass'
								? 'bg-cyan-600 text-white shadow-2xs'
								: 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}"
						>
							ePOP vs Passing
						</button>
					</div>
				</div>

				<div class="p-3">
					<!-- SVG scatter plot -->
					<svg
						viewBox="0 0 {W} {H}"
						class="w-full select-none"
						role="img"
						aria-label="Pareto front scatter plot"
					>
						<g transform="translate({PAD.left},{PAD.top})">
							<!-- Grid lines -->
							{#each [1, 2, 3, 4, 5] as y}
								<line
									x1="0"
									y1={yScale(y)}
									x2={chartW}
									y2={yScale(y)}
									stroke="#e2e8f0"
									stroke-width="1"
									stroke-dasharray="3,3"
									class="dark:stroke-slate-800"
								/>
								<text
									x="-6"
									y={yScale(y) + 3}
									text-anchor="end"
									font-size="10"
									fill="#94a3b8"
									class="font-mono font-semibold"
								>
									{y}
								</text>
							{/each}

							{#each xTicks as xv}
								<line
									x1={xScale(xv)}
									y1="0"
									x2={xScale(xv)}
									y2={chartH}
									stroke="#e2e8f0"
									stroke-width="1"
									stroke-dasharray="3,3"
									class="dark:stroke-slate-800"
								/>
								<text
									x={xScale(xv)}
									y={chartH + 14}
									text-anchor="middle"
									font-size="10"
									fill="#94a3b8"
									class="font-mono font-semibold"
								>
									{xv.toFixed(0)}
								</text>
							{/each}

							<!-- Axes -->
							<line
								x1="0"
								y1={chartH}
								x2={chartW}
								y2={chartH}
								stroke="#cbd5e1"
								stroke-width="1"
								class="dark:stroke-slate-700"
							/>
							<line
								x1="0"
								y1="0"
								x2="0"
								y2={chartH}
								stroke="#cbd5e1"
								stroke-width="1"
								class="dark:stroke-slate-700"
							/>

							<!-- Axis labels -->
							<text
								x={chartW / 2}
								y={chartH + 32}
								text-anchor="middle"
								font-size="11"
								fill="#64748b"
								class="font-semibold"
							>
								ePOP Rating
							</text>
							<text
								transform="rotate(-90)"
								x={-(chartH / 2)}
								y="-30"
								text-anchor="middle"
								font-size="11"
								fill="#64748b"
								class="font-semibold"
							>
								{metric === 'def' ? 'Defense' : 'Passing'} (1–5)
							</text>

							<!-- Chosen teams (muted) -->
							{#each data.teams.filter((t) => chosenSet.has(t.number)) as t}
								{#if t.epop != null && (metric === 'def' ? t.defScore : t.passScore) != null}
									{@const pt = teamPoint(t)}
									<circle
										cx={pt.x}
										cy={pt.y}
										r="3.5"
										fill="#cbd5e1"
										opacity="0.4"
										class="dark:fill-slate-700"
									/>
								{/if}
							{/each}

							<!-- Available Teams & Pareto Front -->
							{#each unchosenTeams as t}
								{#if t.epop != null && (metric === 'def' ? t.defScore : t.passScore) != null}
									{@const pt = teamPoint(t)}
									{@const onFront = paretoFront.includes(t)}
									{@const isHovered = hoverTeam === t.number || selectedTeam === t.number}
									<circle
										cx={pt.x}
										cy={pt.y}
										r={isHovered ? (onFront ? 7 : 5.5) : onFront ? 6 : 4.5}
										fill={onFront ? '#f59e0b' : '#06b6d4'}
										stroke={isHovered ? '#0284c7' : '#ffffff'}
										stroke-width={isHovered ? 2.5 : 1}
										class="cursor-pointer"
										onmouseenter={() => (hoverTeam = t.number)}
										onmouseleave={() => (hoverTeam = null)}
										onclick={() => clickAvailableTeam(t.number)}
										onkeydown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') clickAvailableTeam(t.number);
										}}
										role="button"
										tabindex="0"
									/>
									{#if onFront || isHovered}
										<text
											x={pt.x + 7}
											y={pt.y + 4}
											font-size="10"
											font-weight="700"
											fill={onFront ? '#b45309' : '#0891b2'}
											class="pointer-events-none font-mono select-none"
										>
											{t.number}
										</text>
									{/if}
								{/if}
							{/each}
						</g>
					</svg>

					<!-- Legend -->
					<div
						class="mt-2 flex items-center justify-between border-t border-slate-100 px-2 pt-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400"
					>
						<div class="flex items-center gap-3">
							<span class="flex items-center gap-1.5">
								<span class="inline-block h-2.5 w-2.5 rounded-full bg-amber-400"></span> Pareto Frontier
							</span>
							<span class="flex items-center gap-1.5">
								<span class="inline-block h-2.5 w-2.5 rounded-full bg-cyan-500"></span> Available
							</span>
							<span class="flex items-center gap-1.5">
								<span class="inline-block h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700"
								></span> Picked
							</span>
						</div>
					</div>

					<!-- Active Inspected Team HUD -->
					{#if hoverTeam != null || selectedTeam != null}
						{@const activeTeamNum = (hoverTeam ?? selectedTeam)!}
						{@const t = teamInfo(activeTeamNum)}
						{#if t}
							{@const onFront = paretoFront.some((x) => x.number === t.number)}
							<div
								class="mt-3 rounded-2xl border border-cyan-200/80 bg-cyan-50/60 p-3.5 text-xs shadow-xs dark:border-cyan-900/50 dark:bg-cyan-950/30"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="font-mono text-sm font-black text-cyan-700 dark:text-cyan-300">
											Team {t.number}
										</span>
										<span class="font-bold text-slate-800 dark:text-slate-200">{t.name}</span>
										{#if onFront}
											<span
												class="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
											>
												Pareto
											</span>
										{/if}
									</div>

									<div class="flex items-center gap-1.5">
										<a
											href="/teams/{t.number}"
											class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
										>
											Profile ↗
										</a>
										<button
											type="button"
											onclick={() => quickAddTeam(t.number)}
											class="rounded-lg bg-cyan-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-cyan-700"
										>
											+ Draft
										</button>
									</div>
								</div>

								<div
									class="mt-2.5 grid grid-cols-4 gap-2 border-t border-cyan-100/80 pt-2 text-center text-[11px] dark:border-cyan-900/40"
								>
									<div>
										<span class="text-[10px] font-bold text-slate-400 uppercase">Rank</span>
										<p class="font-mono font-bold text-slate-700 dark:text-slate-300">
											{t.rank != null ? `#${t.rank}` : '—'}
										</p>
									</div>
									<div>
										<span class="text-[10px] font-bold text-slate-400 uppercase">ePOP</span>
										<p class="font-mono font-bold {epopColorClass(t.epop)}">
											{fmt1(t.epop)}
										</p>
									</div>
									<div>
										<span class="text-[10px] font-bold text-slate-400 uppercase">Defense</span>
										<p class="font-mono font-bold text-amber-600 dark:text-amber-400">
											{t.defScore != null ? `${fmt1(t.defScore)}/5` : '—'}
										</p>
									</div>
									<div>
										<span class="text-[10px] font-bold text-slate-400 uppercase">Passing</span>
										<p class="font-mono font-bold text-indigo-600 dark:text-indigo-400">
											{t.passScore != null ? `${fmt1(t.passScore)}/5` : '—'}
										</p>
									</div>
								</div>
							</div>
						{/if}
					{/if}
				</div>

				<!-- Pareto Front Teams Table -->
				{#if paretoSorted.length > 0}
					<div class="border-t border-slate-100 p-3 dark:border-slate-800">
						<p
							class="mb-2 text-[10px] font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400"
						>
							Pareto Frontier Recommendations
						</p>
						<table class="w-full text-xs">
							<thead>
								<tr class="text-left text-[10px] font-bold text-slate-400 uppercase">
									<th class="pb-1">Rank</th>
									<th class="pb-1">Team</th>
									<th class="pb-1">ePOP</th>
									<th class="pb-1">Def</th>
									<th class="pb-1">Pass</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
								{#each paretoSorted as t}
									<tr class="transition-colors hover:bg-amber-50/60 dark:hover:bg-amber-950/20">
										<td class="py-1.5 font-mono font-bold text-slate-400"
											>{t.rank != null ? `#${t.rank}` : '—'}</td
										>
										<td class="py-1.5 font-mono font-bold">
											<a
												href="/teams/{t.number}"
												class="text-cyan-600 hover:underline dark:text-cyan-400"
											>
												{t.number}
											</a>
										</td>
										<td class="py-1.5 font-mono font-bold {epopColorClass(t.epop)}"
											>{fmt1(t.epop)}</td
										>
										<td
											class="py-1.5 font-mono {metric === 'def'
												? 'font-bold text-slate-800 dark:text-slate-200'
												: 'text-slate-500'}"
										>
											{fmt1(t.defScore)}
										</td>
										<td
											class="py-1.5 font-mono {metric === 'pass'
												? 'font-bold text-slate-800 dark:text-slate-200'
												: 'text-slate-500'}"
										>
											{fmt1(t.passScore)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right: Available Teams Pool -->
		<div
			class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div class="border-b border-slate-100 p-4 dark:border-slate-800">
				<div class="flex items-center justify-between">
					<h2 class="text-sm font-bold text-slate-900 dark:text-white">Available Draft Pool</h2>
					<span
						class="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
					>
						{filteredTeams.length} Teams
					</span>
				</div>
				<p class="mt-0.5 text-[11px] text-slate-400">
					Select a team to place them in the draft board, or tap "+" for automatic snake slotting.
				</p>
			</div>

			<!-- Search bar -->
			<div class="border-b border-slate-100 p-3 dark:border-slate-800">
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Search team # or name…"
					class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
				/>
			</div>

			<div class="max-h-[32rem] overflow-y-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr
							class="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/50"
						>
							<th class="w-10 px-2.5 py-2.5"></th>
							<th class="px-2.5 py-2.5">Rank</th>
							<th class="px-2.5 py-2.5">Team</th>
							<th class="px-2.5 py-2.5">ePOP</th>
							<th class="px-2.5 py-2.5">Defense</th>
							<th class="px-2.5 py-2.5">Passing</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
						{#each filteredTeams as t}
							{@const onFront = paretoFront.includes(t)}
							{@const isSelected = t.number === selectedTeam}
							<tr
								class="cursor-pointer transition-colors
									{isSelected
									? 'bg-cyan-50 dark:bg-cyan-950/60'
									: onFront
										? 'bg-amber-50/60 hover:bg-amber-100/60 dark:bg-amber-950/30 dark:hover:bg-amber-950/50'
										: 'hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20'}"
								onclick={() => clickAvailableTeam(t.number)}
							>
								<td class="px-2.5 py-2">
									<button
										onclick={(e) => {
											e.stopPropagation();
											quickAddTeam(t.number);
										}}
										class="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-600 font-mono text-xs font-bold text-white shadow-2xs transition-colors hover:bg-cyan-700"
										title="Quick add to next snake slot"
									>
										+
									</button>
								</td>
								<td class="px-2.5 py-2 font-mono text-xs font-bold text-slate-400">
									{t.rank != null ? `#${t.rank}` : '—'}
								</td>
								<td class="px-2.5 py-2">
									<div class="flex items-center gap-1.5">
										<a
											href="/teams/{t.number}"
											onclick={(e) => e.stopPropagation()}
											class="font-mono text-xs font-black text-cyan-600 hover:underline dark:text-cyan-400"
										>
											{t.number}
										</a>
										{#if onFront}
											<span
												class="py-0.2 rounded bg-amber-100 px-1 font-mono text-[9px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
											>
												Pareto
											</span>
										{/if}
									</div>
									<p class="max-w-[120px] truncate text-[11px] text-slate-500 dark:text-slate-400">
										{t.name}
									</p>
								</td>
								<td class="px-2.5 py-2 font-mono text-xs font-bold {epopColorClass(t.epop)}">
									{fmt1(t.epop)}
								</td>
								<td class="px-2.5 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
									{#if t.defScore != null}
										<span class="font-bold text-slate-800 dark:text-slate-200"
											>{fmt1(t.defScore)}</span
										>
										<span class="text-[10px] text-slate-400"> ({fmtPct(t.defRate)})</span>
									{:else}
										<span class="text-slate-300 dark:text-slate-600">—</span>
									{/if}
								</td>
								<td class="px-2.5 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
									{#if t.passScore != null}
										<span class="font-bold text-slate-800 dark:text-slate-200"
											>{fmt1(t.passScore)}</span
										>
										<span class="text-[10px] text-slate-400"> ({fmtPct(t.passRate)})</span>
									{:else}
										<span class="text-slate-300 dark:text-slate-600">—</span>
									{/if}
								</td>
							</tr>
						{/each}

						{#if filteredTeams.length === 0}
							<tr>
								<td colspan="6" class="p-8 text-center text-xs text-slate-400 italic">
									{searchQuery ? 'No teams match your search.' : 'All teams have been placed.'}
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<!-- Reset Confirmation Modal -->
{#if confirmResetOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
		>
			<h2 class="text-base font-bold text-slate-900 dark:text-white">Reset Alliance Selection?</h2>
			<p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
				This will clear all {chosenSet.size} team placements and reset the draft board. This action cannot
				be undone.
			</p>
			<div class="mt-5 flex justify-end gap-2.5">
				<button
					onclick={() => (confirmResetOpen = false)}
					class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
				>
					Cancel
				</button>
				<button
					onclick={resetAlliances}
					class="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-rose-700"
				>
					Reset Draft Board
				</button>
			</div>
		</div>
	</div>
{/if}
