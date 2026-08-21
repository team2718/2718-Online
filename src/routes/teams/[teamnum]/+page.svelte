<script lang="ts">
	import { enhance } from '$app/forms';
	import { playoffKey } from '$lib/matchUtils';
	import { page } from '$app/state';

	let { data } = $props();

	const fromAllianceSelection = $derived(
		page.url.searchParams.get('from') === 'alliance-selection'
	);

	const reports = $derived(data?.matchReports ?? []);
	const pitReports = $derived(data?.pitReports ?? []);
	const canGoUnderTrench = $derived(pitReports.at(-1)?.data?.canGoUnderTrench ?? null);

	// Deduplicate reports by matchId for average stats calculation
	const avgStats = $derived.by(() => {
		if (!reports || reports.length === 0) return null;

		const byMatch = new Map<string, typeof reports>();
		for (const r of reports) {
			if (!byMatch.has(r.matchId)) byMatch.set(r.matchId, []);
			byMatch.get(r.matchId)!.push(r);
		}
		const deduped = [...byMatch.values()].map((group) => {
			if (group.length === 1) return group[0];
			const n = group.length;
			const avg = (fn: (d: (typeof group)[0]['data']) => number) =>
				group.reduce((s, r) => s + fn(r.data), 0) / n;
			const majority = (fn: (d: (typeof group)[0]['data']) => boolean) =>
				group.filter((r) => fn(r.data)).length >= n / 2;
			const d0 = group[0].data;
			return {
				...group[0],
				data: {
					...d0,
					autoFuel: avg((d) => Number(d?.autoFuel) || 0),
					autoFuelMissed: avg((d) => Number(d?.autoFuelMissed) || 0),
					teleFuelScore: avg((d) => Number(d?.teleFuelScore) || 0),
					telePassScore: avg((d) => Number(d?.telePassScore) || 0),
					teleDefScore: avg((d) => Number(d?.teleDefScore) || 0),
					didLeave: majority((d) => !!d?.didLeave),
					autoClimbed: majority((d) => !!d?.autoClimbed),
					teleDidPass: majority((d) => !!d?.teleDidPass),
					teleDidDef: majority((d) => !!d?.teleDidDef)
				}
			};
		});

		const count = deduped.length;
		const sum = deduped.reduce(
			(acc, curr) => {
				const d = curr.data;
				const didPass = !!d?.teleDidPass;
				const didDef = !!d?.teleDidDef;
				return {
					autoFuel: acc.autoFuel + (Number(d?.autoFuel) || 0),
					autoFuelMissed: acc.autoFuelMissed + (Number(d?.autoFuelMissed) || 0),
					teleFuelScore: acc.teleFuelScore + (Number(d?.teleFuelScore) || 0),
					passCount: acc.passCount + (didPass ? 1 : 0),
					telePassScore: acc.telePassScore + (didPass ? Number(d?.telePassScore) || 0 : 0),
					defCount: acc.defCount + (didDef ? 1 : 0),
					teleDefScore: acc.teleDefScore + (didDef ? Number(d?.teleDefScore) || 0 : 0),
					didLeave: acc.didLeave + (d?.didLeave ? 1 : 0),
					autoClimbed: acc.autoClimbed + (d?.autoClimbed ? 1 : 0),
					climbL1: acc.climbL1 + (d?.climbType === 1 ? 1 : 0),
					climbL2: acc.climbL2 + (d?.climbType === 2 ? 1 : 0),
					climbL3: acc.climbL3 + (d?.climbType === 3 ? 1 : 0)
				};
			},
			{
				autoFuel: 0,
				autoFuelMissed: 0,
				teleFuelScore: 0,
				passCount: 0,
				telePassScore: 0,
				defCount: 0,
				teleDefScore: 0,
				didLeave: 0,
				autoClimbed: 0,
				climbL1: 0,
				climbL2: 0,
				climbL3: 0
			}
		);

		return {
			autoFuel: (sum.autoFuel / count).toFixed(1),
			autoFuelMissed: (sum.autoFuelMissed / count).toFixed(1),
			teleFuelScore: (sum.teleFuelScore / count).toFixed(1),
			telePassScore: sum.passCount > 0 ? (sum.telePassScore / sum.passCount).toFixed(1) : null,
			passPercent: Math.round((sum.passCount / count) * 100),
			teleDefScore: sum.defCount > 0 ? (sum.teleDefScore / sum.defCount).toFixed(1) : null,
			defPercent: Math.round((sum.defCount / count) * 100),
			didLeavePercent: Math.round((sum.didLeave / count) * 100),
			autoClimbedPercent: Math.round((sum.autoClimbed / count) * 100),
			climbL1Pct: Math.round((sum.climbL1 / count) * 100),
			climbL2Pct: Math.round((sum.climbL2 / count) * 100),
			climbL3Pct: Math.round((sum.climbL3 / count) * 100),
			reportCount: count
		};
	});

	const formatFeature = (key: string) => {
		return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
	};

	const reportsSorted = $derived(
		[...reports].sort((a, b) => a.matchId.localeCompare(b.matchId, undefined, { numeric: true }))
	);

	function climbLabel(v: number | undefined) {
		return ['None', 'L1', 'L2', 'L3'][v ?? 0] ?? 'None';
	}
	function cardLabel(v: number | undefined) {
		return ['None', 'Yellow', 'Red'][v ?? 0] ?? 'None';
	}
	function posLabel(v: number | undefined) {
		return ['L Trench', 'L Bump', 'Center', 'R Bump', 'R Trench'][v ?? 2] ?? '—';
	}
	function yn(v: boolean | undefined) {
		return v ? '✓' : '✗';
	}
	function sparkX(m: number, minM: number, maxM: number, leftPad: number, chartWidth: number) {
		return leftPad + ((m - minM) / Math.max(maxM - minM, 1)) * chartWidth;
	}
	function sparkY(
		v: number,
		rawMin: number,
		rawMax: number,
		vPad: number,
		topPad: number,
		chartHeight: number
	) {
		return (
			topPad + (1 - (v - (rawMin - vPad)) / Math.max(rawMax - rawMin + 2 * vPad, 1)) * chartHeight
		);
	}

	const sortedTeamMatches = $derived.by(() => {
		const nonPlayoff = data.teamMatches.filter((m) => m.matchType !== 'playoff');
		const playoff = data.teamMatches
			.filter((m) => m.matchType === 'playoff')
			.sort((a, b) => playoffKey(a.id) - playoffKey(b.id));
		return [...nonPlayoff, ...playoff];
	});
</script>

<div class="mx-auto max-w-7xl space-y-6">
	<!-- Top Breadcrumb & Header -->
	<div class="border-b border-slate-200/80 pb-5 dark:border-slate-800/80">
		<div class="mb-3">
			<a
				href={fromAllianceSelection ? '/alliance-selection' : '/teams'}
				class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
			>
				<svg
					class="h-3.5 w-3.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Back to {fromAllianceSelection ? 'Alliance Selection' : 'Teams'}
			</a>
		</div>

		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<div>
				<div class="flex items-center gap-3">
					<h1
						class="font-mono text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white"
					>
						Team {data.teamnum}
					</h1>
					{#if data.team}
						<span class="text-xl font-bold text-slate-700 dark:text-slate-300">
							{data.team.name}
						</span>
					{/if}
				</div>
				{#if data.team && (data.team.metadata as Record<string, unknown>)?.state_prov}
					<p class="mt-1 text-xs text-slate-400">
						{[
							(data.team.metadata as Record<string, unknown>)?.city,
							(data.team.metadata as Record<string, unknown>)?.state_prov,
							(data.team.metadata as Record<string, unknown>)?.country
						]
							.filter(Boolean)
							.join(', ')}
					</p>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				<a
					href="https://www.thebluealliance.com/team/{data.teamnum}"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
				>
					TBA ↗
				</a>
				<a
					href="https://www.statbotics.io/team/{data.teamnum}"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
				>
					Statbotics ↗
				</a>
			</div>
		</div>
	</div>

	<!-- ePOP & Power Rating Summary -->
	{#if data.epop != null}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div
				class="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-4 dark:border-purple-900/50 dark:bg-purple-950/20"
			>
				<p
					class="text-[11px] font-bold tracking-wider text-purple-600 uppercase dark:text-purple-400"
				>
					ePOP Rating
				</p>
				<p class="mt-1 font-mono text-3xl font-black text-purple-700 dark:text-purple-300">
					{data.epop.toFixed(1)}
				</p>
				<p class="mt-1 text-[11px] text-purple-500">Regularized points above replacement</p>
			</div>

			{#if data.epopHistory && data.epopHistory.length >= 2}
				{@const pts = data.epopHistory}
				{@const W = 300}
				{@const H = 54}
				{@const PAD = { t: 6, b: 6, l: 6, r: 6 }}
				{@const cW = W - PAD.l - PAD.r}
				{@const cH = H - PAD.t - PAD.b}
				{@const minM = pts[0].matchNumber}
				{@const maxM = pts[pts.length - 1].matchNumber}
				{@const rawMin = Math.min(...pts.map((p) => p.epop))}
				{@const rawMax = Math.max(...pts.map((p) => p.epop))}
				{@const vPad = Math.max((rawMax - rawMin) * 0.15, 2)}
				{@const xp = (m: number) => sparkX(m, minM, maxM, PAD.l, cW)}
				{@const yp = (v: number) => sparkY(v, rawMin, rawMax, vPad, PAD.t, cH)}
				{@const polyPts = pts
					.map((p) => `${xp(p.matchNumber).toFixed(1)},${yp(p.epop).toFixed(1)}`)
					.join(' ')}
				<div
					class="col-span-2 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900"
				>
					<div class="mb-1 flex items-center justify-between">
						<p
							class="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400"
						>
							ePOP Progression By Match
						</p>
						<span class="font-mono text-[10px] text-purple-600 dark:text-purple-400">
							Q{minM} → Q{maxM}
						</span>
					</div>
					<svg viewBox="0 0 {W} {H}" class="w-full" style="height: 48px">
						<polyline
							points={polyPts}
							fill="none"
							stroke="#8b5cf6"
							stroke-width="2"
							stroke-linejoin="round"
							stroke-linecap="round"
						/>
						{#each pts as p}
							<circle
								cx={xp(p.matchNumber).toFixed(1)}
								cy={yp(p.epop).toFixed(1)}
								r="2.5"
								fill="#8b5cf6"
							/>
						{/each}
					</svg>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Statistics Overview Cards -->
	<div>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-base font-bold text-slate-900 dark:text-white">Scouting Averages</h2>
			{#if avgStats}
				<span
					class="rounded-full bg-cyan-50 px-2.5 py-0.5 font-mono text-xs font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
				>
					{avgStats.reportCount} Matches Observed
				</span>
			{/if}
		</div>

		{#if avgStats}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div
					class="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900"
				>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
						Tele Fuel Rating
					</p>
					<p class="mt-1 font-mono text-2xl font-black text-slate-900 dark:text-white">
						{avgStats.teleFuelScore}<span class="text-xs font-normal text-slate-400">/5</span>
					</p>
				</div>
				<div
					class="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900"
				>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
						Passing Rating
					</p>
					{#if avgStats.telePassScore !== null}
						<p class="mt-1 font-mono text-2xl font-black text-slate-900 dark:text-white">
							{avgStats.telePassScore}<span class="text-xs font-normal text-slate-400">/5</span>
						</p>
						<p class="text-[10px] text-slate-400">{avgStats.passPercent}% of matches</p>
					{:else}
						<p class="mt-1 font-mono text-2xl font-bold text-slate-300 dark:text-slate-600">—</p>
						<p class="text-[10px] text-slate-400">Never passed</p>
					{/if}
				</div>
				<div
					class="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900"
				>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
						Defense Rating
					</p>
					{#if avgStats.teleDefScore !== null}
						<p class="mt-1 font-mono text-2xl font-black text-slate-900 dark:text-white">
							{avgStats.teleDefScore}<span class="text-xs font-normal text-slate-400">/5</span>
						</p>
						<p class="text-[10px] text-slate-400">{avgStats.defPercent}% of matches</p>
					{:else}
						<p class="mt-1 font-mono text-2xl font-bold text-slate-300 dark:text-slate-600">—</p>
						<p class="text-[10px] text-slate-400">Never defended</p>
					{/if}
				</div>
				<div
					class="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900"
				>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
						Auto Scored / Missed
					</p>
					<p class="mt-1 font-mono text-2xl font-black text-slate-900 dark:text-white">
						{avgStats.autoFuel}
						<span class="text-xs font-normal text-slate-400">/ {avgStats.autoFuelMissed}</span>
					</p>
				</div>
				<div
					class="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900"
				>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
						Climb Breakdown
					</p>
					<div
						class="mt-1 flex items-center gap-2 font-mono text-xs font-bold text-slate-700 dark:text-slate-300"
					>
						<span
							class={avgStats.climbL1Pct > 0
								? 'text-cyan-600 dark:text-cyan-400'
								: 'text-slate-300 dark:text-slate-600'}>L1: {avgStats.climbL1Pct}%</span
						>
						<span
							class={avgStats.climbL2Pct > 0
								? 'text-cyan-600 dark:text-cyan-400'
								: 'text-slate-300 dark:text-slate-600'}>L2: {avgStats.climbL2Pct}%</span
						>
						<span
							class={avgStats.climbL3Pct > 0
								? 'text-cyan-600 dark:text-cyan-400'
								: 'text-slate-300 dark:text-slate-600'}>L3: {avgStats.climbL3Pct}%</span
						>
					</div>
				</div>
				<div
					class="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900"
				>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
						Auto Climb Success
					</p>
					<p class="mt-1 font-mono text-2xl font-black text-slate-900 dark:text-white">
						{avgStats.autoClimbedPercent}%
					</p>
				</div>
				<div
					class="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900"
				>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Under Trench</p>
					<p class="mt-1 font-mono text-2xl font-black text-slate-900 dark:text-white">
						{canGoUnderTrench === true ? 'Yes' : canGoUnderTrench === false ? 'No' : '—'}
					</p>
				</div>
				<div
					class="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900"
				>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Auto Leave %</p>
					<p class="mt-1 font-mono text-2xl font-black text-slate-900 dark:text-white">
						{avgStats.didLeavePercent}%
					</p>
				</div>
			</div>
		{:else if canGoUnderTrench !== null}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div
					class="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900"
				>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Under Trench</p>
					<p class="mt-1 font-mono text-2xl font-black text-slate-900 dark:text-white">
						{canGoUnderTrench === true ? 'Yes' : 'No'}
					</p>
				</div>
			</div>
		{:else}
			<div
				class="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800"
			>
				<p class="text-xs text-slate-400">
					No match scouting data recorded yet for Team {data.teamnum}.
				</p>
			</div>
		{/if}
	</div>

	<!-- Main Content: Left = Reports & Pit, Right = Match History -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
		<div class="space-y-6 lg:col-span-8">
			<!-- Match Scouting Reports -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-base font-bold text-slate-900 dark:text-white">Match Reports</h2>
					<span
						class="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
					>
						{reports.length} Report{reports.length !== 1 ? 's' : ''}
					</span>
				</div>

				{#if reportsSorted.length > 0}
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{#each reportsSorted as report}
							<div
								class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800/80 dark:bg-slate-900"
							>
								<div
									class="flex items-center justify-between border-b border-slate-100 bg-slate-50/75 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/50"
								>
									<a
										href="/matches?match={report.matchId}"
										class="font-mono font-black text-cyan-600 hover:underline dark:text-cyan-400"
									>
										{report.matchId}
									</a>
									<span class="truncate font-medium text-slate-400">{report.scouterName}</span>
								</div>
								<div class="space-y-2 p-3 text-xs">
									<div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
										Pos: {posLabel(report.data?.startingPosition)}
									</div>

									<!-- Auto -->
									<div class="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
										<p class="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
											Auto
										</p>
										<div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
											<span class="text-slate-500">Leave:</span>
											<span
												class="font-bold {report.data?.didLeave
													? 'text-emerald-600'
													: 'text-slate-400'}">{yn(report.data?.didLeave)}</span
											>
											<span class="text-slate-500">Climb:</span>
											<span
												class="font-bold {report.data?.autoClimbed
													? 'text-emerald-600'
													: 'text-slate-400'}">{yn(report.data?.autoClimbed)}</span
											>
											<span class="text-slate-500">Scored:</span>
											<span class="font-bold text-cyan-600 dark:text-cyan-400"
												>{report.data?.autoFuel ?? 0}</span
											>
											<span class="text-slate-500">Missed:</span>
											<span class="font-bold text-rose-500">{report.data?.autoFuelMissed ?? 0}</span
											>
										</div>
									</div>

									<!-- Teleop -->
									<div class="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
										<p class="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
											Teleop
										</p>
										<div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
											<span class="text-slate-500">Fuel:</span>
											<span class="font-bold"
												>{report.data?.teleFuelScoredAny
													? `${report.data?.teleFuelScore}/5`
													: '—'}</span
											>
											<span class="text-slate-500">Pass:</span>
											<span class="font-bold"
												>{report.data?.teleDidPass ? `${report.data?.telePassScore}/5` : '—'}</span
											>
											<span class="text-slate-500">Def:</span>
											<span class="font-bold"
												>{report.data?.teleDidDef ? `${report.data?.teleDefScore}/5` : '—'}</span
											>
										</div>
									</div>

									<!-- Endgame -->
									<div class="flex items-center justify-between text-[11px]">
										<span class="text-slate-500"
											>Climb: <b class="text-slate-800 dark:text-slate-200"
												>{climbLabel(report.data?.climbType)}</b
											></span
										>
										{#if (report.data?.cardReceived ?? 0) > 0}
											<span
												class="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
											>
												{cardLabel(report.data?.cardReceived)}
											</span>
										{/if}
									</div>

									{#if (data.isAdmin || data.isPrivileged) && report.data?.notes}
										<p
											class="border-t border-slate-100 pt-1.5 text-[11px] text-slate-500 italic dark:border-slate-800"
										>
											"{report.data.notes}"
										</p>
									{/if}

									{#if data.isAdmin}
										<form method="POST" action="?/deleteReport" use:enhance class="pt-1">
											<input type="hidden" name="id" value={report.id} />
											<button
												type="submit"
												class="w-full rounded-lg bg-rose-50 py-1 text-[10px] font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
											>
												Delete Report
											</button>
										</form>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div
						class="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800"
					>
						<p class="text-xs text-slate-400">No match reports recorded yet.</p>
					</div>
				{/if}
			</div>

			<!-- Pit Scouting Reports -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-base font-bold text-slate-900 dark:text-white">Pit Scouting Specs</h2>
					<span
						class="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
					>
						{pitReports.length} Pit {pitReports.length === 1 ? 'Entry' : 'Entries'}
					</span>
				</div>

				{#if pitReports.length > 0}
					{#each pitReports as report}
						<div
							class="mb-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
						>
							<div
								class="flex items-center justify-between border-b border-slate-100 bg-slate-50/75 px-5 py-3 text-xs dark:border-slate-800 dark:bg-slate-800/50"
							>
								<div>
									{#if report.data}
										{@const pitData = report.data}
										<span class="font-bold text-cyan-700 dark:text-cyan-400">
											Scouted by {pitData.scoutName || 'Unknown'}
										</span>
										<span class="ml-2 text-slate-400">
											{pitData.timestamp ? new Date(pitData.timestamp).toLocaleString() : ''}
										</span>
									{:else}
										<span class="font-bold text-slate-700">Pit Report</span>
									{/if}
								</div>

								{#if data.isAdmin}
									<form method="POST" action="?/deletePitReport" use:enhance>
										<input type="hidden" name="id" value={report.id} />
										<button
											type="submit"
											class="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
											title="Delete Pit Report"
										>
											<svg
												class="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</button>
									</form>
								{/if}
							</div>

							{#if report.data}
								{@const pitData = report.data}
								<div class="grid grid-cols-2 gap-4 p-5 text-xs sm:grid-cols-4">
									<div>
										<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
											Drivetrain
										</p>
										<p class="mt-0.5 font-semibold text-slate-900 dark:text-white">
											{pitData.drivetrain || '—'}
										</p>
									</div>
									<div>
										<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
											Shooter
										</p>
										<p class="mt-0.5 font-semibold text-slate-900 dark:text-white">
											{pitData.shooterType || '—'}
										</p>
									</div>
									<div>
										<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
											Intake
										</p>
										<p class="mt-0.5 font-semibold text-slate-900 dark:text-white">
											{pitData.intakeType || '—'}
										</p>
									</div>
									<div>
										<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
											Max Climb
										</p>
										<p class="mt-0.5 font-semibold text-slate-900 dark:text-white">
											{pitData.climb || '—'}
										</p>
									</div>
									<div>
										<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
											Under Trench
										</p>
										<p class="mt-0.5 font-semibold text-slate-900 dark:text-white">
											{pitData.canGoUnderTrench === true
												? 'Yes'
												: pitData.canGoUnderTrench === false
													? 'No'
													: '—'}
										</p>
									</div>
									<div>
										<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
											Weight
										</p>
										<p class="mt-0.5 font-semibold text-slate-900 dark:text-white">
											{pitData.weightLbs || '??'} lbs
										</p>
									</div>
									<div>
										<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
											Fuel / Sec
										</p>
										<p class="mt-0.5 font-semibold text-slate-900 dark:text-white">
											{pitData.fuelPerSecond || 'N/A'}
										</p>
									</div>
									<div>
										<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
											Hopper
										</p>
										<p class="mt-0.5 font-semibold text-slate-900 dark:text-white">
											{pitData.hopperCapacity || '—'}
										</p>
									</div>

									<div
										class="col-span-2 border-t border-slate-100 pt-3 sm:col-span-4 dark:border-slate-800"
									>
										<p class="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
											Autonomous Capabilities
										</p>
										<div class="space-y-2">
											<div>
												<span class="text-slate-400">Preferred Start:</span>
												<span class="ml-2 font-bold text-slate-800 dark:text-slate-200"
													>{pitData.autoStart || '—'}</span
												>
											</div>
											<div class="flex flex-wrap gap-1.5">
												{#if pitData.autoFeatures && pitData.autoFeatures.length > 0}
													{#each pitData.autoFeatures as feature}
														<span
															class="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
														>
															{formatFeature(feature)}
														</span>
													{/each}
												{:else}
													<span class="text-slate-400 italic"
														>No specific auto features reported.</span
													>
												{/if}
											</div>
										</div>
									</div>

									{#if (data.isAdmin || data.isPrivileged) && (pitData.knownIssues || pitData.comments)}
										<div
											class="col-span-2 grid gap-3 border-t border-slate-100 pt-3 sm:col-span-4 sm:grid-cols-2 dark:border-slate-800"
										>
											{#if pitData.knownIssues}
												<div
													class="rounded-xl border border-rose-100 bg-rose-50/60 p-3 dark:border-rose-900/40 dark:bg-rose-950/20"
												>
													<p
														class="text-[10px] font-bold tracking-wider text-rose-700 uppercase dark:text-rose-300"
													>
														Known Issues
													</p>
													<p class="mt-1 text-xs text-rose-900 dark:text-rose-200">
														{pitData.knownIssues}
													</p>
												</div>
											{/if}
											{#if pitData.comments}
												<div
													class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
												>
													<p
														class="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400"
													>
														General Notes
													</p>
													<p class="mt-1 text-xs text-slate-700 dark:text-slate-300">
														{pitData.comments}
													</p>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				{:else}
					<div
						class="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800"
					>
						<div
							class="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
						>
							<svg
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
								/>
							</svg>
						</div>
						<p class="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
							Awaiting Pit Inspection
						</p>
						<p class="mt-0.5 text-xs text-slate-400">
							No pit scouting data recorded yet for Team {data.teamnum}.
						</p>
						<a
							href="/pit-scout/new?team={data.teamnum}"
							class="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-cyan-700 active:bg-cyan-800"
						>
							+ Scout Pit for Team {data.teamnum} →
						</a>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Column: Match History Timeline -->
		<div class="lg:col-span-4">
			<div class="sticky top-24 space-y-3">
				<div class="flex items-center justify-between">
					<h2 class="text-base font-bold text-slate-900 dark:text-white">Match Schedule</h2>
					<span
						class="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
					>
						{sortedTeamMatches.length} Matches
					</span>
				</div>

				<div
					class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
				>
					<!-- Header row -->
					<div
						class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/75 px-3 py-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/50"
					>
						<span class="w-14">Match</span>
						<span class="flex-1 text-center">Score</span>
						<span class="w-8 text-center">Res</span>
						{#if data.hasEpopData}
							<span class="w-8 text-center text-purple-600 dark:text-purple-400">Pred</span>
						{/if}
					</div>

					<div class="divide-y divide-slate-100 dark:divide-slate-800">
						{#each sortedTeamMatches as match}
							{@const onRed = [match.red1, match.red2, match.red3].includes(data.teamnum)}
							{@const myScore = onRed ? match.redScore : match.blueScore}
							{@const theirScore = onRed ? match.blueScore : match.redScore}
							{@const isWin = myScore != null && theirScore != null && myScore > theirScore}
							{@const isLoss = myScore != null && theirScore != null && myScore < theirScore}
							{@const predProb = data.matchPredictions[match.id] ?? 0.5}
							{@const isPredWin = predProb > 0.51}
							{@const isPredLoss = predProb < 0.49}
							<a
								href="/matches?match={match.id}"
								class="flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20"
							>
								<span class="w-14 font-mono font-bold text-slate-700 dark:text-slate-300">
									{match.id}
								</span>

								{#if myScore != null && theirScore != null}
									<span class="flex-1 text-center font-mono">
										<span
											class="{onRed
												? 'text-rose-600 dark:text-rose-400'
												: 'text-blue-600 dark:text-blue-400'} font-bold"
										>
											{myScore}
										</span>
										<span class="text-slate-300 dark:text-slate-600">-</span>
										<span
											class={!onRed
												? 'text-rose-600 dark:text-rose-400'
												: 'text-blue-600 dark:text-blue-400'}
										>
											{theirScore}
										</span>
									</span>
									<span
										class="inline-flex w-8 items-center justify-center rounded text-[11px] font-bold
										{isWin
											? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
											: isLoss
												? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
												: 'text-slate-400'}"
									>
										{isWin ? 'W' : isLoss ? 'L' : 'T'}
									</span>
								{:else}
									<span class="flex-1 text-center text-slate-400 italic">Unplayed</span>
									<span class="w-8"></span>
								{/if}

								{#if data.hasEpopData}
									<span
										class="inline-flex w-8 items-center justify-center rounded text-[11px] font-bold
										{isPredWin
											? 'text-purple-600 dark:text-purple-400'
											: isPredLoss
												? 'text-slate-400'
												: 'text-slate-400'}"
									>
										{isPredWin ? 'W' : isPredLoss ? 'L' : 'T'}
									</span>
								{/if}
							</a>
						{/each}

						{#if sortedTeamMatches.length === 0}
							<div class="p-6 text-center text-xs text-slate-400 italic">No matches scheduled.</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
