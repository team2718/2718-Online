<script lang="ts">
	let { data } = $props();

	const cov = $derived(data.coverage);
	const rankings = $derived(data.rankings);

	const fmt1 = (v: number) => v.toFixed(1);
	const fmtPct = (v: number) => `${Math.round(v)}%`;
</script>

<div class="mx-auto max-w-7xl px-4 py-6">

	<!-- Header -->
	<div class="mb-6 flex flex-wrap items-end justify-between gap-2">
		<div>
			<h1 class="text-3xl font-black tracking-tight text-gray-900">2718 Online</h1>
		</div>
		<div class="flex gap-2">
			<a href="/scan" class="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700">Scan QR</a>
			<a href="/pit-scout" class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">Pit Scout</a>
		</div>
	</div>

	<!-- Coverage stat chips -->
	<div class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
			<p class="text-2xl font-black text-gray-900">{cov.totalTeams}</p>
			<p class="mt-0.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">Teams</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
			<p class="text-2xl font-black {cov.matchesWithReports < cov.totalMatchesScheduled ? 'text-orange-500' : 'text-green-600'}">{cov.matchesWithReports}</p>
			<p class="mt-0.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">Scouted</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
			<p class="text-2xl font-black text-gray-900">{cov.pitScoutedTeams}</p>
			<p class="mt-0.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">Pit Scouted</p>
		</div>
		<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
			<p class="text-2xl font-black text-blue-600">{cov.totalReports}</p>
			<p class="mt-0.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">Reports</p>
		</div>
	</div>

	<!-- Rankings grid -->
	{#if rankings.autoScoring.length > 0}
		<h2 class="mb-3 text-lg font-bold text-gray-700">Rankings</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

			<!-- Avg Auto Fuel -->
			<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
					<h3 class="text-sm font-bold text-gray-700">Avg Auto Fuel</h3>
					<p class="text-xs text-gray-400">Avg game pieces scored in auto</p>
				</div>
				<div>
					{#each rankings.autoScoring as row, i}
						<a href="/teams/{row.number}" class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 {i > 0 ? 'border-t border-gray-100' : ''}">
							<span class="w-5 text-right text-xs font-bold text-gray-300">{i + 1}</span>
							<span class="w-12 font-bold text-gray-800">{row.number}</span>
							<span class="min-w-0 flex-1 truncate text-xs text-gray-500">{row.name}</span>
							<span class="text-sm font-bold text-blue-600">{fmt1(row.value)}</span>
						</a>
					{/each}
				</div>
			</div>

			<!-- Avg Tele Fuel Rate -->
			<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
					<h3 class="text-sm font-bold text-gray-700">Avg Tele Fuel Rate</h3>
					<p class="text-xs text-gray-400">Avg teleop scoring rate (1–5)</p>
				</div>
				<div>
					{#each rankings.teleopRate as row, i}
						<a href="/teams/{row.number}" class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 {i > 0 ? 'border-t border-gray-100' : ''}">
							<span class="w-5 text-right text-xs font-bold text-gray-300">{i + 1}</span>
							<span class="w-12 font-bold text-gray-800">{row.number}</span>
							<span class="min-w-0 flex-1 truncate text-xs text-gray-500">{row.name}</span>
							<span class="text-sm font-bold text-green-600">{fmt1(row.value)}<span class="text-xs font-normal text-gray-400">/5</span></span>
						</a>
					{/each}
				</div>
			</div>

			<!-- Avg Defense Score -->
			<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
					<h3 class="text-sm font-bold text-gray-700">Avg Defense Score</h3>
					<p class="text-xs text-gray-400">Avg score when defense was played (1–5)</p>
				</div>
				<div>
					{#if rankings.defense.length > 0}
						{#each rankings.defense as row, i}
							<a href="/teams/{row.number}" class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 {i > 0 ? 'border-t border-gray-100' : ''}">
								<span class="w-5 text-right text-xs font-bold text-gray-300">{i + 1}</span>
								<span class="w-12 font-bold text-gray-800">{row.number}</span>
								<span class="min-w-0 flex-1 truncate text-xs text-gray-500">{row.name}</span>
								<span class="text-sm font-bold text-orange-600">{fmt1(row.value)}<span class="text-xs font-normal text-gray-400">/5</span></span>
							</a>
						{/each}
					{:else}
						<p class="px-4 py-6 text-center text-xs text-gray-400 italic">No defense data yet</p>
					{/if}
				</div>
			</div>

			<!-- Avg Pass Score -->
			<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
					<h3 class="text-sm font-bold text-gray-700">Avg Pass Score</h3>
					<p class="text-xs text-gray-400">Avg score when passing was performed (1–5)</p>
				</div>
				<div>
					{#if rankings.passScore.length > 0}
						{#each rankings.passScore as row, i}
							<a href="/teams/{row.number}" class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 {i > 0 ? 'border-t border-gray-100' : ''}">
								<span class="w-5 text-right text-xs font-bold text-gray-300">{i + 1}</span>
								<span class="w-12 font-bold text-gray-800">{row.number}</span>
								<span class="min-w-0 flex-1 truncate text-xs text-gray-500">{row.name}</span>
								<span class="text-sm font-bold text-violet-600">{fmt1(row.value)}<span class="text-xs font-normal text-gray-400">/5</span></span>
							</a>
						{/each}
					{:else}
						<p class="px-4 py-6 text-center text-xs text-gray-400 italic">No passing data yet</p>
					{/if}
				</div>
			</div>

			<!-- Climbing (at least L1) -->
			<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
					<h3 class="text-sm font-bold text-gray-700">Climb Rate</h3>
					<p class="text-xs text-gray-400">% of matches with at least L1 climb</p>
				</div>
				<div>
					{#each rankings.climbing as row, i}
						<a href="/teams/{row.number}" class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 {i > 0 ? 'border-t border-gray-100' : ''}">
							<span class="w-5 text-right text-xs font-bold text-gray-300">{i + 1}</span>
							<span class="w-12 font-bold text-gray-800">{row.number}</span>
							<span class="min-w-0 flex-1 truncate text-xs text-gray-500">{row.name}</span>
							<div class="flex items-center gap-1.5">
								<div class="h-1.5 w-12 overflow-hidden rounded-full bg-gray-100">
									<div class="h-full rounded-full bg-purple-500" style="width: {Math.min(row.value, 100)}%"></div>
								</div>
								<span class="text-sm font-bold text-purple-600">{fmtPct(row.value)}</span>
							</div>
						</a>
					{/each}
				</div>
			</div>

			<!-- Quick links card -->
			<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
					<h3 class="text-sm font-bold text-gray-700">Quick Links</h3>
					<p class="text-xs text-gray-400">Jump to a section</p>
				</div>
				<div class="p-4 space-y-2">
					<a href="/prematch" class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50">
						<span class="text-sm font-semibold text-gray-700">Pre-Match Analysis</span>
						<span class="text-xs text-gray-400">→</span>
					</a>
					<a href="/teams" class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 hover:border-blue-200 hover:bg-blue-50">
						<span class="text-sm font-semibold text-gray-700">All Teams</span>
						<span class="text-xs text-gray-400">→</span>
					</a>
					<a href="/matches" class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 hover:border-blue-200 hover:bg-blue-50">
						<span class="text-sm font-semibold text-gray-700">Match Schedule</span>
						<span class="text-xs text-gray-400">→</span>
					</a>
					<a href="/pit-scout" class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 hover:border-blue-200 hover:bg-blue-50">
						<span class="text-sm font-semibold text-gray-700">Pit Scout Status</span>
						<span class="text-xs text-gray-400">→</span>
					</a>
					<a href="/scan" class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 hover:border-green-200 hover:bg-green-50">
						<span class="text-sm font-semibold text-gray-700">Scan QR Code</span>
						<span class="text-xs text-gray-400">→</span>
					</a>
				</div>
			</div>

		</div>
	{:else}
		<!-- Empty state -->
		<div class="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
			<p class="mb-1 text-lg font-bold text-gray-400">No scouting data yet</p>
		</div>
	{/if}
</div>
