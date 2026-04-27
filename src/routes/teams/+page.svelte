<script lang="ts">
	let { data } = $props();

	type SortKey = 'rank' | 'number' | 'name' | 'epop' | 'record' | 'rankingPoints';

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

	const sortedTeams = $derived.by(() => {
		return [...data.teams].sort((a, b) => {
			let v = 0;
			if (sortKey === 'rank') v = (a.rank ?? Infinity) - (b.rank ?? Infinity);
			else if (sortKey === 'number') v = a.number - b.number;
			else if (sortKey === 'name') v = a.name.localeCompare(b.name);
			else if (sortKey === 'epop') v = (a.epop ?? -1) - (b.epop ?? -1);
			else if (sortKey === 'record') v = recordSortVal(a.record) - recordSortVal(b.record);
			else if (sortKey === 'rankingPoints') v = (a.rankingPoints ?? -1) - (b.rankingPoints ?? -1);
			if (v === 0) v = a.number - b.number;
			return sortDir === 'asc' ? v : -v;
		});
	});

	function arrow(key: SortKey) {
		if (sortKey !== key) return '';
		return sortDir === 'asc' ? ' ↑' : ' ↓';
	}

	// ePOP percentile — sorted list of all non-null ePOP values
	const epopSorted = $derived(
		data.teams.filter((t) => t.epop != null).map((t) => t.epop!).sort((a, b) => a - b)
	);

	/**
	 * Percentile 0–100: fraction of teams with a strictly lower ePOP.
	 * Returns null if ePOP is null or no values exist.
	 */
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

	let scrollEl = $state<HTMLDivElement | undefined>(undefined);
	let canScrollRight = $state(false);

	function checkScroll() {
		if (!scrollEl) return;
		canScrollRight = Math.round(scrollEl.scrollLeft + scrollEl.clientWidth) < scrollEl.scrollWidth;
	}

	$effect(() => {
		if (!scrollEl) return;
		checkScroll();
		const ro = new ResizeObserver(checkScroll);
		ro.observe(scrollEl);
		return () => ro.disconnect();
	});
</script>

<div class="mx-auto max-w-5xl px-4 py-6">
	<h1 class="mb-6 text-3xl font-black tracking-tight text-gray-900">Teams</h1>

	{#if data.teams.length > 0}
		<div class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
		<div class="overflow-x-auto" bind:this={scrollEl} onscroll={checkScroll}>
			<table class="w-full min-w-[36rem] text-sm">
				<thead>
					<tr class="border-b border-gray-200 bg-gray-50 text-left">
						<th class="w-16">
							<button
								onclick={() => toggleSort('rank')}
								class="w-full px-4 py-3 text-left text-xs font-bold tracking-wider text-gray-500 uppercase hover:text-gray-900"
							>
								Rank{arrow('rank')}
							</button>
						</th>
						<th class="w-24">
							<button
								onclick={() => toggleSort('number')}
								class="w-full px-4 py-3 text-left text-xs font-bold tracking-wider text-gray-500 uppercase hover:text-gray-900"
							>
								Team Number{arrow('number')}
							</button>
						</th>
						<th>
							<button
								onclick={() => toggleSort('name')}
								class="w-full px-4 py-3 text-left text-xs font-bold tracking-wider text-gray-500 uppercase hover:text-gray-900"
							>
								Team Name{arrow('name')}
							</button>
						</th>
						<th class="w-28">
							<button
								onclick={() => toggleSort('epop')}
								class="w-full px-4 py-3 text-left text-xs font-bold tracking-wider text-gray-500 uppercase hover:text-gray-900"
							>
								ePOP{arrow('epop')}
							</button>
						</th>
						<th class="w-28">
							<button
								onclick={() => toggleSort('record')}
								class="w-full px-4 py-3 text-left text-xs font-bold tracking-wider text-gray-500 uppercase hover:text-gray-900"
							>
								Record{arrow('record')}
							</button>
						</th>
						<th class="w-32">
							<button
								onclick={() => toggleSort('rankingPoints')}
								class="w-full px-4 py-3 text-left text-xs font-bold tracking-wider text-gray-500 uppercase hover:text-gray-900"
							>
								Rank Pts{arrow('rankingPoints')}
							</button>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each sortedTeams as team, i}
						<tr class="border-b border-gray-100 transition-colors hover:bg-blue-50 {i % 2 === 1 ? 'bg-gray-50/40' : ''}">
							<td class="px-4 py-2.5 text-sm font-bold text-gray-500">
								{#if team.rank != null}
									#{team.rank}
								{:else}
									<span class="text-gray-300">—</span>
								{/if}
							</td>
							<td class="px-4 py-2.5">
								<a href="/teams/{team.number}" class="font-black text-blue-600 hover:underline">
									{team.number}
								</a>
							</td>
							<td class="px-4 py-2.5">
								<a href="/teams/{team.number}" class="font-medium text-gray-800 hover:underline">
									{team.name}
								</a>
							</td>
							<td class="px-4 py-2.5">
								{#if team.epop != null}
									<span class="{epopColorClass(team.epop)}">{team.epop.toFixed(1)}</span>
								{:else}
									<span class="text-gray-300">—</span>
								{/if}
							</td>
							<td class="px-4 py-2.5 font-mono text-sm">
								{#if team.record.wins + team.record.losses + team.record.ties > 0}
									<span class="font-semibold text-gray-800">{team.record.wins}-{team.record.losses}{team.record.ties > 0 ? `-${team.record.ties}` : ''}</span>
								{:else}
									<span class="text-gray-300">—</span>
								{/if}
							</td>
							<td class="px-4 py-2.5">
								{#if team.rankingPoints != null}
									<span class="font-bold text-gray-800">{team.rankingPoints.toFixed(2)}</span>
								{:else}
									<span class="text-gray-300">—</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if canScrollRight}
			<div class="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent"></div>
		{/if}
		</div>
	{:else}
		<p class="text-gray-500">No teams found.</p>
	{/if}
</div>
