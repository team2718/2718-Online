<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { matchFullLabel } from '$lib/matchUtils';
	import { SvelteMap } from 'svelte/reactivity';

	let { data } = $props();

	const m = $derived(data.match);
	const reports = $derived(data.reports ?? []);

	// Build a map of teamNumber → reports[] for quick lookup
	const reportsByTeam = $derived.by(() => {
		const map = new SvelteMap<number, typeof reports>();
		for (const r of reports) {
			if (!map.has(r.teamNumber)) map.set(r.teamNumber, []);
			map.get(r.teamNumber)!.push(r);
		}
		return map;
	});

	// Resolve alliance slots from schedule or from report data
	const redSlots = $derived.by((): (number | null)[] => {
		if (m?.red1 || m?.red2 || m?.red3) return [m.red1, m.red2, m.red3];
		return reports.filter((r) => r.data?.alliance === 0).map((r) => r.teamNumber);
	});

	const blueSlots = $derived.by((): (number | null)[] => {
		if (m?.blue1 || m?.blue2 || m?.blue3) return [m.blue1, m.blue2, m.blue3];
		return reports.filter((r) => r.data?.alliance === 1).map((r) => r.teamNumber);
	});

	const matchLabel = $derived(m ? matchFullLabel(m) : data.matchId);

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
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<!-- Top Breadcrumb & Header -->
	<div class="border-b border-slate-200/80 pb-5 dark:border-slate-800/80">
		<div class="mb-3">
			<a
				href={resolve('/reports')}
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
				Back to All Reports
			</a>
		</div>

		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
			<div>
				<h1
					class="font-mono text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white"
				>
					{matchLabel} Reports
				</h1>
				<p class="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
					Raw scouter observations for all six robot slots.
				</p>
			</div>

			<div class="flex items-center gap-2">
				<a
					href={`${resolve('/matches')}?match=${encodeURIComponent(m?.id ?? data.matchId)}`}
					rel="external"
					class="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-cyan-700 shadow-2xs transition-colors hover:bg-cyan-50 dark:border-slate-800 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-cyan-950/40"
				>
					Match Analysis ↗
				</a>
			</div>
		</div>
	</div>

	<!-- Red Alliance Reports -->
	<div class="space-y-3">
		<h2
			class="flex items-center gap-2 text-xs font-black tracking-wider text-rose-600 uppercase dark:text-rose-400"
		>
			<span class="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
			Red Alliance Reports
		</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each [redSlots[0], redSlots[1], redSlots[2]] as teamNum, idx (teamNum != null ? teamNum : `red-${idx}`)}
				{@const teamReports = teamNum != null ? (reportsByTeam.get(teamNum) ?? []) : []}
				<div
					class="overflow-hidden rounded-2xl border bg-white shadow-xs dark:bg-slate-900
                    {teamReports.length > 0
						? 'border-rose-200/80 dark:border-rose-900/60'
						: 'border-slate-200/80 dark:border-slate-800/80'}"
				>
					<!-- Team Header -->
					<div
						class="flex items-center justify-between border-b px-4 py-2.5 text-xs
                        {teamReports.length > 0
							? 'border-rose-100 bg-rose-50/75 dark:border-rose-900/40 dark:bg-rose-950/30'
							: 'border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50'}"
					>
						{#if teamNum != null}
							<a
								href={resolve('/teams/[teamnum]', { teamnum: String(teamNum) })}
								class="font-mono text-base font-black hover:underline
                                   {teamReports.length > 0
									? 'text-rose-600 dark:text-rose-400'
									: 'text-slate-400'}"
							>
								{teamNum}
							</a>
							{#if teamReports.length === 1}
								<span class="text-[11px] font-medium text-slate-400"
									>{teamReports[0].scouterName}</span
								>
							{:else if teamReports.length > 1}
								<span
									class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
								>
									{teamReports.length} reports
								</span>
							{:else}
								<span class="text-[11px] text-slate-400 italic">No report</span>
							{/if}
						{:else}
							<span class="text-xs text-slate-400">—</span>
						{/if}
					</div>

					{#each teamReports as report, i (report.id)}
						{#if teamReports.length > 1}
							<div
								class="{i > 0
									? 'border-t border-slate-100 dark:border-slate-800'
									: ''} bg-slate-50/50 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:bg-slate-800/30"
							>
								Report {i + 1} · {report.scouterName}
							</div>
						{/if}
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
									<span class="font-bold text-rose-500">{report.data?.autoFuelMissed ?? 0}</span>
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
					{/each}
				</div>
			{/each}
		</div>
	</div>

	<!-- Blue Alliance Reports -->
	<div class="space-y-3">
		<h2
			class="flex items-center gap-2 text-xs font-black tracking-wider text-blue-600 uppercase dark:text-blue-400"
		>
			<span class="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
			Blue Alliance Reports
		</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each [blueSlots[0], blueSlots[1], blueSlots[2]] as teamNum, idx (teamNum != null ? teamNum : `blue-${idx}`)}
				{@const teamReports = teamNum != null ? (reportsByTeam.get(teamNum) ?? []) : []}
				<div
					class="overflow-hidden rounded-2xl border bg-white shadow-xs dark:bg-slate-900
                    {teamReports.length > 0
						? 'border-blue-200/80 dark:border-blue-900/60'
						: 'border-slate-200/80 dark:border-slate-800/80'}"
				>
					<!-- Team Header -->
					<div
						class="flex items-center justify-between border-b px-4 py-2.5 text-xs
                        {teamReports.length > 0
							? 'border-blue-100 bg-blue-50/75 dark:border-blue-900/40 dark:bg-blue-950/30'
							: 'border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50'}"
					>
						{#if teamNum != null}
							<a
								href={resolve('/teams/[teamnum]', { teamnum: String(teamNum) })}
								class="font-mono text-base font-black hover:underline
                                   {teamReports.length > 0
									? 'text-blue-600 dark:text-blue-400'
									: 'text-slate-400'}"
							>
								{teamNum}
							</a>
							{#if teamReports.length === 1}
								<span class="text-[11px] font-medium text-slate-400"
									>{teamReports[0].scouterName}</span
								>
							{:else if teamReports.length > 1}
								<span
									class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
								>
									{teamReports.length} reports
								</span>
							{:else}
								<span class="text-[11px] text-slate-400 italic">No report</span>
							{/if}
						{:else}
							<span class="text-xs text-slate-400">—</span>
						{/if}
					</div>

					{#each teamReports as report, i (report.id)}
						{#if teamReports.length > 1}
							<div
								class="{i > 0
									? 'border-t border-slate-100 dark:border-slate-800'
									: ''} bg-slate-50/50 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:bg-slate-800/30"
							>
								Report {i + 1} · {report.scouterName}
							</div>
						{/if}
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
									<span class="font-bold text-rose-500">{report.data?.autoFuelMissed ?? 0}</span>
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
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
