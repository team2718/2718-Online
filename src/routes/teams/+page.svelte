<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props();

	type SortKey = 'rank' | 'number' | 'name' | 'epop' | 'record' | 'rankingPoints';

	let searchFilter = $state('');
	let sortKey = $state<SortKey>('rank');
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === 'rank' || key === 'number' || key === 'name' ? 'asc' : 'desc';
		}
	}

	function recordSortVal(r: { wins: number; losses: number; ties: number }) {
		return r.wins * 100 + r.ties;
	}

	const filteredTeams = $derived.by(() => {
		const q = searchFilter.trim().toLowerCase();
		if (!q) return data.teams;
		return data.teams.filter(
			(t) => String(t.number).includes(q) || t.name.toLowerCase().includes(q)
		);
	});

	const sortedTeams = $derived.by(() => {
		return [...filteredTeams].sort((a, b) => {
			let v = 0;
			if (sortKey === 'rank') v = (a.rank ?? Infinity) - (b.rank ?? Infinity);
			else if (sortKey === 'number') v = a.number - b.number;
			else if (sortKey === 'name') v = a.name.localeCompare(b.name);
			else if (sortKey === 'epop') v = (a.epop ?? -1) - (b.epop ?? -1);
			else if (sortKey === 'record') v = recordSortVal(a.record) - recordSortVal(b.record);
			else if (sortKey === 'rankingPoints') v = (a.rankingPoints ?? -1) - (b.rankingPoints ?? -1);

			const primary = sortDir === 'asc' ? v : -v;
			if (primary !== 0) return primary;

			return a.number - b.number;
		});
	});

	function sortIcon(key: SortKey) {
		if (sortKey !== key) return '↕';
		return sortDir === 'asc' ? '↑' : '↓';
	}

	// ePOP percentile calculation
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
</script>

<div class="mx-auto max-w-6xl space-y-4 sm:space-y-6">
	<!-- Page Header & Filter -->
	<div
		class="flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end dark:border-slate-800/80"
	>
		<div>
			<div class="flex items-center gap-2.5">
				<h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
					Teams
				</h1>
				<span
					class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
				>
					{#if searchFilter.trim()}
						{sortedTeams.length} of {data.teams.length}
					{:else}
						{data.teams.length} Teams
					{/if}
				</span>
			</div>
			<p class="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
				Event team directory, rankings, ePOP ratings, and qualification records.
			</p>
		</div>

		<!-- Filter Input -->
		<div class="relative w-full sm:w-64">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<svg
					class="h-4 w-4 text-slate-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
					/>
				</svg>
			</div>
			<input
				type="text"
				bind:value={searchFilter}
				placeholder="Filter by team # or name…"
				class="w-full rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-9 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
			/>
			{#if searchFilter}
				<button
					type="button"
					onclick={() => (searchFilter = '')}
					class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
				>
					✕
				</button>
			{/if}
		</div>
	</div>

	<!-- Mobile Sort Selector (<640px) -->
	<div class="flex items-center justify-between gap-2 sm:hidden">
		<span class="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Sort By:</span>
		<div class="flex flex-wrap gap-1">
			{#each ['rank', 'number', 'epop', 'record'] as const as key (key)}
				<button
					type="button"
					onclick={() => toggleSort(key)}
					class="rounded-lg px-2 py-1 font-mono text-[11px] font-bold transition-colors
						{sortKey === key
						? 'bg-cyan-600 text-white'
						: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}"
				>
					{key.toUpperCase()}
					{sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</button>
			{/each}
		</div>
	</div>

	{#if data.teams.length > 0}
		<!-- Mobile Card View (<640px) -->
		<div
			class="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-xs sm:hidden dark:divide-slate-800 dark:border-slate-800/80 dark:bg-slate-900"
		>
			{#each sortedTeams as team (team.number)}
				<a
					href={resolve('/teams/[teamnum]', { teamnum: String(team.number) })}
					class="flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-cyan-50/50 active:bg-cyan-50 dark:hover:bg-cyan-950/20"
				>
					<div class="flex items-center gap-3">
						<span
							class="flex h-6 w-7 items-center justify-center rounded font-mono text-xs font-bold
							{team.rank === 1
								? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
								: team.rank === 2
									? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
									: team.rank === 3
										? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
										: 'text-slate-400'}"
						>
							#{team.rank ?? '—'}
						</span>
						<div>
							<div class="flex items-center gap-1.5">
								<span class="font-mono text-sm font-black text-cyan-600 dark:text-cyan-400">
									{team.number}
								</span>
								<span class="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
									{team.name}
								</span>
							</div>
							<p class="font-mono text-[11px] text-slate-400">
								Rec: {team.record.wins}-{team.record.losses}{team.record.ties > 0
									? `-${team.record.ties}`
									: ''}
							</p>
						</div>
					</div>

					<div class="text-right">
						{#if team.epop != null}
							<p class="font-mono text-sm font-black {epopColorClass(team.epop)}">
								{team.epop.toFixed(1)}
							</p>
							<p class="text-[10px] text-slate-400 uppercase">ePOP</p>
						{:else}
							<span class="text-xs text-slate-400">—</span>
						{/if}
					</div>
				</a>
			{/each}

			{#if sortedTeams.length === 0}
				<div class="p-8 text-center text-xs text-slate-400 italic">
					No teams match "{searchFilter}".
				</div>
			{/if}
		</div>

		<!-- Desktop Table View (>=640px) -->
		<div
			class="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs sm:block dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[40rem] text-left text-xs">
					<thead>
						<tr
							class="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400"
						>
							<th class="w-20">
								<button
									onclick={() => toggleSort('rank')}
									class="flex w-full items-center gap-1 px-4 py-3 font-bold tracking-wider uppercase hover:text-slate-900 dark:hover:text-white"
								>
									Rank <span class="font-mono text-[10px] text-slate-400">{sortIcon('rank')}</span>
								</button>
							</th>
							<th class="w-28">
								<button
									onclick={() => toggleSort('number')}
									class="flex w-full items-center gap-1 px-4 py-3 font-bold tracking-wider uppercase hover:text-slate-900 dark:hover:text-white"
								>
									Number <span class="font-mono text-[10px] text-slate-400"
										>{sortIcon('number')}</span
									>
								</button>
							</th>
							<th>
								<button
									onclick={() => toggleSort('name')}
									class="flex w-full items-center gap-1 px-4 py-3 font-bold tracking-wider uppercase hover:text-slate-900 dark:hover:text-white"
								>
									Team Name <span class="font-mono text-[10px] text-slate-400"
										>{sortIcon('name')}</span
									>
								</button>
							</th>
							<th class="w-28">
								<button
									onclick={() => toggleSort('epop')}
									class="flex w-full items-center gap-1 px-4 py-3 font-bold tracking-wider uppercase hover:text-slate-900 dark:hover:text-white"
								>
									ePOP <span class="font-mono text-[10px] text-slate-400">{sortIcon('epop')}</span>
								</button>
							</th>
							<th class="w-28">
								<button
									onclick={() => toggleSort('record')}
									class="flex w-full items-center gap-1 px-4 py-3 font-bold tracking-wider uppercase hover:text-slate-900 dark:hover:text-white"
								>
									Record <span class="font-mono text-[10px] text-slate-400"
										>{sortIcon('record')}</span
									>
								</button>
							</th>
							<th class="w-32">
								<button
									onclick={() => toggleSort('rankingPoints')}
									class="flex w-full items-center gap-1 px-4 py-3 font-bold tracking-wider uppercase hover:text-slate-900 dark:hover:text-white"
								>
									Rank Pts <span class="font-mono text-[10px] text-slate-400"
										>{sortIcon('rankingPoints')}</span
									>
								</button>
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
						{#each sortedTeams as team, i (team.number)}
							<tr
								class="transition-colors hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 {i % 2 === 1
									? 'bg-slate-50/30 dark:bg-slate-900/30'
									: ''}"
							>
								<td class="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">
									{#if team.rank != null}
										<span
											class="inline-flex h-5 w-6 items-center justify-center rounded text-[11px]
											{team.rank === 1
												? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
												: team.rank === 2
													? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
													: team.rank === 3
														? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
														: 'text-slate-500'}"
										>
											#{team.rank}
										</span>
									{:else}
										<span class="text-slate-300 dark:text-slate-600">—</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<a
										href={resolve('/teams/[teamnum]', { teamnum: String(team.number) })}
										class="font-mono text-sm font-black text-cyan-600 hover:text-cyan-700 hover:underline dark:text-cyan-400"
									>
										{team.number}
									</a>
								</td>
								<td class="px-4 py-3">
									<a
										href={resolve('/teams/[teamnum]', { teamnum: String(team.number) })}
										class="font-medium text-slate-800 hover:text-cyan-600 hover:underline dark:text-slate-200 dark:hover:text-cyan-400"
									>
										{team.name}
									</a>
								</td>
								<td class="px-4 py-3 font-mono text-xs">
									{#if team.epop != null}
										<span class={epopColorClass(team.epop)}>{team.epop.toFixed(1)}</span>
									{:else}
										<span class="text-slate-300 dark:text-slate-600">—</span>
									{/if}
								</td>
								<td class="px-4 py-3 font-mono text-xs">
									{#if team.record.wins + team.record.losses + team.record.ties > 0}
										<span class="font-semibold text-slate-700 dark:text-slate-300">
											{team.record.wins}-{team.record.losses}{team.record.ties > 0
												? `-${team.record.ties}`
												: ''}
										</span>
									{:else}
										<span class="text-slate-300 dark:text-slate-600">—</span>
									{/if}
								</td>
								<td class="px-4 py-3 font-mono text-xs">
									{#if team.rankingPoints != null}
										<span class="font-bold text-slate-800 dark:text-slate-200">
											{team.rankingPoints.toFixed(2)}
										</span>
									{:else}
										<span class="text-slate-300 dark:text-slate-600">—</span>
									{/if}
								</td>
							</tr>
						{/each}

						{#if sortedTeams.length === 0}
							<tr>
								<td colspan="6" class="p-8 text-center text-xs text-slate-400 italic">
									No teams match "{searchFilter}".
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<div
			class="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
		>
			<p class="text-xs text-slate-400">
				No teams found in database. Import teams from TBA in Admin.
			</p>
		</div>
	{/if}
</div>
