<script lang="ts">
	import { resolve } from '$app/paths';
	import { fmt1, fmtPct } from '$lib/utils/formatters';

	let { data } = $props();

	const cov = $derived(data.coverage);
	const rankings = $derived(data.rankings);
	const pitPct = $derived(
		cov.totalTeams > 0 ? Math.round((cov.pitScoutedTeams / cov.totalTeams) * 100) : 0
	);
	const matchPct = $derived(
		cov.totalMatchesScheduled > 0
			? Math.round((cov.matchesWithReports / cov.totalMatchesScheduled) * 100)
			: 0
	);
</script>

<div class="mx-auto max-w-7xl space-y-6">
	<!-- Header & Quick Actions -->
	<div
		class="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end dark:border-slate-800/80"
	>
		<div>
			<h1 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white">2718 Online</h1>
			<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
				FRC Team 2718 Scouting & Match Strategy
			</p>
		</div>

		<!-- Quick Actions -->
		<div class="flex flex-wrap gap-2">
			<a
				href={resolve('/scan')}
				class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-emerald-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
					/>
				</svg>
				Scan QR
			</a>
			<a
				href={resolve('/pit-scout')}
				class="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-cyan-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
				Pit Scout
			</a>
			<a
				href="/StrategyBoard.html"
				rel="external"
				target="_blank"
				class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
			>
				Strategy Board ↗
			</a>
		</div>
	</div>

	<!-- Coverage Stat Chips -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<!-- Pit Scouting Coverage -->
		<div
			class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div class="flex items-center justify-between">
				<p class="text-xs font-bold tracking-wider text-slate-400 uppercase">
					Pit Scouting Progress
				</p>
				<span
					class="rounded-md bg-cyan-50 px-2 py-0.5 font-mono text-xs font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
				>
					{pitPct}%
				</span>
			</div>
			<p class="mt-2 text-2xl font-black text-slate-900 dark:text-white">
				{cov.pitScoutedTeams}
				<span class="text-sm font-semibold text-slate-400">/ {cov.totalTeams}</span>
			</p>
			<!-- Mini Progress Bar -->
			<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
				<div
					class="h-full rounded-full bg-cyan-500 transition-all duration-500"
					style="width: {pitPct}%"
				></div>
			</div>
		</div>

		<!-- Match Scouting Coverage -->
		<div
			class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div class="flex items-center justify-between">
				<p class="text-xs font-bold tracking-wider text-slate-400 uppercase">Matches Scouted</p>
				{#if cov.totalMatchesScheduled > 0}
					<span
						class="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
					>
						{matchPct}%
					</span>
				{/if}
			</div>
			<p class="mt-2 text-2xl font-black text-slate-900 dark:text-white">
				{cov.matchesWithReports}
				{#if cov.totalMatchesScheduled > 0}
					<span class="text-sm font-semibold text-slate-400">/ {cov.totalMatchesScheduled}</span>
				{/if}
			</p>
			<!-- Mini Progress Bar -->
			<div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
				<div
					class="h-full rounded-full bg-emerald-500 transition-all duration-500"
					style="width: {matchPct > 0 ? matchPct : 100}%"
				></div>
			</div>
		</div>

		<!-- Total Scouting Reports -->
		<div
			class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div class="flex items-center justify-between">
				<p class="text-xs font-bold tracking-wider text-slate-400 uppercase">Total Match Reports</p>
				<span
					class="rounded-md bg-purple-50 px-2 py-0.5 font-mono text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300"
				>
					Active
				</span>
			</div>
			<p class="mt-2 text-2xl font-black text-slate-900 dark:text-white">{cov.totalReports}</p>
			<p class="mt-2 text-xs text-slate-400">Individual robot-match observations recorded</p>
		</div>
	</div>

	<!-- Rankings Grid Section -->
	{#if rankings.autoScoring.length > 0 || (data.epopLeaderboard && data.epopLeaderboard.length > 0)}
		<div>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-bold text-slate-900 dark:text-white">
					Team Performance Leaderboards
				</h2>
				<a
					href={resolve('/teams')}
					class="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline dark:text-cyan-400"
				>
					View All Teams →
				</a>
			</div>

			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
				<!-- ePOP Leaderboard (Featured) -->
				{#if data.epopLeaderboard && data.epopLeaderboard.length > 0}
					<div
						class="overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-purple-900/60 dark:bg-slate-900"
					>
						<div
							class="border-b border-purple-100 bg-purple-50/75 px-4 py-3 dark:border-purple-900/50 dark:bg-purple-950/40"
						>
							<div class="flex items-center justify-between">
								<h3
									class="text-xs font-black tracking-wider text-purple-900 uppercase dark:text-purple-300"
								>
									ePOP Power Rankings
								</h3>
								<span
									class="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300"
								>
									Model
								</span>
							</div>
							<p class="text-[11px] text-purple-600/80 dark:text-purple-400">
								Scouting-informed regularized OPR
							</p>
						</div>
						<div class="divide-y divide-slate-100 dark:divide-slate-800">
							{#each data.epopLeaderboard as row, i (row.number)}
								<a
									href={resolve('/teams/[teamnum]', { teamnum: String(row.number) })}
									class="group flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-purple-50/60 dark:hover:bg-purple-950/30"
								>
									<span
										class="flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-bold
										{i === 0
											? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
											: i === 1
												? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
												: i === 2
													? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
													: 'text-slate-400'}"
									>
										{i + 1}
									</span>
									<span
										class="w-12 font-mono font-bold text-slate-800 group-hover:text-purple-600 dark:text-slate-200 dark:group-hover:text-purple-400"
									>
										{row.number}
									</span>
									<span class="min-w-0 flex-1 truncate text-slate-500 dark:text-slate-400">
										{row.name}
									</span>
									<span class="font-mono text-xs font-black text-purple-600 dark:text-purple-400">
										{row.epop.toFixed(1)}
									</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Avg Auto Fuel -->
				<div
					class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900"
				>
					<div
						class="border-b border-slate-100 bg-slate-50/75 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50"
					>
						<h3
							class="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
						>
							Avg Auto Fuel Scored
						</h3>
						<p class="text-[11px] text-slate-400">Autonomous game pieces made per match</p>
					</div>
					<div class="divide-y divide-slate-100 dark:divide-slate-800">
						{#each rankings.autoScoring as row, i (row.number)}
							<a
								href={resolve('/teams/[teamnum]', { teamnum: String(row.number) })}
								class="group flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
							>
								<span class="w-5 text-right font-mono text-[10px] font-bold text-slate-400">
									{i + 1}
								</span>
								<span
									class="w-12 font-mono font-bold text-slate-800 group-hover:text-cyan-600 dark:text-slate-200 dark:group-hover:text-cyan-400"
								>
									{row.number}
								</span>
								<span class="min-w-0 flex-1 truncate text-slate-500 dark:text-slate-400">
									{row.name}
								</span>
								<span class="font-mono text-xs font-black text-cyan-600 dark:text-cyan-400">
									{fmt1(row.value)}
								</span>
							</a>
						{/each}
					</div>
				</div>

				<!-- Defense Rating -->
				<div
					class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900"
				>
					<div
						class="border-b border-slate-100 bg-slate-50/75 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50"
					>
						<h3
							class="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
						>
							Avg Defense Rating
						</h3>
						<p class="text-[11px] text-slate-400">Average capability when defense played (1–5)</p>
					</div>
					<div class="divide-y divide-slate-100 dark:divide-slate-800">
						{#if rankings.defense.length > 0}
							{#each rankings.defense as row, i (row.number)}
								<a
									href={resolve('/teams/[teamnum]', { teamnum: String(row.number) })}
									class="group flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
								>
									<span class="w-5 text-right font-mono text-[10px] font-bold text-slate-400">
										{i + 1}
									</span>
									<span
										class="w-12 font-mono font-bold text-slate-800 group-hover:text-amber-600 dark:text-slate-200 dark:group-hover:text-amber-400"
									>
										{row.number}
									</span>
									<span class="min-w-0 flex-1 truncate text-slate-500 dark:text-slate-400">
										{row.name}
									</span>
									<span class="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
										{fmt1(row.value)}<span class="font-normal text-slate-400">/5</span>
									</span>
								</a>
							{/each}
						{:else}
							<p class="px-4 py-6 text-center text-xs text-slate-400 italic">No defense data yet</p>
						{/if}
					</div>
				</div>

				<!-- Passing Efficiency -->
				<div
					class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900"
				>
					<div
						class="border-b border-slate-100 bg-slate-50/75 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50"
					>
						<h3
							class="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
						>
							Avg Passing Rating
						</h3>
						<p class="text-[11px] text-slate-400">Passing effectiveness when active (1–5)</p>
					</div>
					<div class="divide-y divide-slate-100 dark:divide-slate-800">
						{#if rankings.passScore.length > 0}
							{#each rankings.passScore as row, i (row.number)}
								<a
									href={resolve('/teams/[teamnum]', { teamnum: String(row.number) })}
									class="group flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
								>
									<span class="w-5 text-right font-mono text-[10px] font-bold text-slate-400">
										{i + 1}
									</span>
									<span
										class="w-12 font-mono font-bold text-slate-800 group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-400"
									>
										{row.number}
									</span>
									<span class="min-w-0 flex-1 truncate text-slate-500 dark:text-slate-400">
										{row.name}
									</span>
									<span class="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
										{fmt1(row.value)}<span class="font-normal text-slate-400">/5</span>
									</span>
								</a>
							{/each}
						{:else}
							<p class="px-4 py-6 text-center text-xs text-slate-400 italic">No passing data yet</p>
						{/if}
					</div>
				</div>

				<!-- Climb Rate -->
				<div
					class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900"
				>
					<div
						class="border-b border-slate-100 bg-slate-50/75 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50"
					>
						<h3
							class="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
						>
							Climb Success Rate
						</h3>
						<p class="text-[11px] text-slate-400">% of matches with successful climb</p>
					</div>
					<div class="divide-y divide-slate-100 dark:divide-slate-800">
						{#each rankings.climbing as row, i (row.number)}
							<a
								href={resolve('/teams/[teamnum]', { teamnum: String(row.number) })}
								class="group flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
							>
								<span class="w-5 text-right font-mono text-[10px] font-bold text-slate-400">
									{i + 1}
								</span>
								<span
									class="w-12 font-mono font-bold text-slate-800 group-hover:text-emerald-600 dark:text-slate-200 dark:group-hover:text-emerald-400"
								>
									{row.number}
								</span>
								<span class="min-w-0 flex-1 truncate text-slate-500 dark:text-slate-400">
									{row.name}
								</span>
								<div class="flex items-center gap-2">
									<div
										class="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
									>
										<div
											class="h-full rounded-full bg-emerald-500"
											style="width: {Math.min(row.value, 100)}%"
										></div>
									</div>
									<span class="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
										{fmtPct(row.value)}
									</span>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<!-- Quick Access Hub -->
				<div
					class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900"
				>
					<div
						class="border-b border-slate-100 bg-slate-50/75 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50"
					>
						<h3
							class="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300"
						>
							Quick Navigation
						</h3>
						<p class="text-[11px] text-slate-400">Jump directly into match tools</p>
					</div>
					<div class="space-y-1.5 p-3">
						<a
							href={resolve('/matches')}
							class="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-cyan-200 hover:bg-cyan-50 dark:border-slate-800 dark:text-slate-200 dark:hover:border-cyan-900 dark:hover:bg-cyan-950/40"
						>
							<span>Match Analysis & Win Prob</span>
							<span class="text-cyan-500">→</span>
						</a>
						<a
							href={resolve('/teams')}
							class="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-cyan-200 hover:bg-cyan-50 dark:border-slate-800 dark:text-slate-200 dark:hover:border-cyan-900 dark:hover:bg-cyan-950/40"
						>
							<span>All Teams Directory</span>
							<span class="text-cyan-500">→</span>
						</a>
						<a
							href={resolve('/reports')}
							class="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-cyan-200 hover:bg-cyan-50 dark:border-slate-800 dark:text-slate-200 dark:hover:border-cyan-900 dark:hover:bg-cyan-950/40"
						>
							<span>Match Scouting Reports</span>
							<span class="text-cyan-500">→</span>
						</a>
						<a
							href={resolve('/pit-scout')}
							class="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-cyan-200 hover:bg-cyan-50 dark:border-slate-800 dark:text-slate-200 dark:hover:border-cyan-900 dark:hover:bg-cyan-950/40"
						>
							<span>Pit Scouting Status</span>
							<span class="text-cyan-500">→</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Empty State -->
		<div
			class="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
		>
			<div
				class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400"
			>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			</div>
			<h3 class="mt-4 text-base font-bold text-slate-800 dark:text-white">
				No scouting data recorded yet
			</h3>
			<p class="mt-1 text-xs text-slate-400">
				Import the match schedule from The Blue Alliance or start scanning match QR codes.
			</p>
			<div class="mt-6 flex justify-center gap-3">
				<a
					href={resolve('/admin')}
					class="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
				>
					Import from TBA
				</a>
				<a
					href={resolve('/scan')}
					class="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-cyan-700"
				>
					Scan QR Codes
				</a>
			</div>
		</div>
	{/if}
</div>
