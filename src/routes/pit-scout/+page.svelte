<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props();

	let searchFilter = $state('');

	const teams = $derived(data?.teams ?? []);
	const scouted = $derived(teams.filter((t) => t.pitScouted).length);
	const unscouted = $derived(teams.filter((t) => !t.pitScouted).length);
	const pct = $derived(teams.length > 0 ? Math.round((scouted / teams.length) * 100) : 0);

	const filteredTeams = $derived.by(() => {
		const q = searchFilter.trim().toLowerCase();
		const list = q
			? teams.filter((t) => String(t.number).includes(q) || t.name.toLowerCase().includes(q))
			: [...teams];

		return list.sort((a, b) => {
			if (a.pitScouted !== b.pitScouted) {
				return a.pitScouted ? 1 : -1; // unscouted (false) first, scouted (true) last
			}
			return a.number - b.number;
		});
	});
</script>

<div class="mx-auto max-w-4xl space-y-4 sm:space-y-6">
	<!-- Header & Progress -->
	<div class="border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
			<div>
				<div class="flex items-center gap-2.5">
					<h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
						Pit Scouting
					</h1>
					<span
						class="rounded-full bg-cyan-50 px-2.5 py-0.5 font-mono text-xs font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
					>
						{pct}% Complete
					</span>
				</div>
				<p class="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
					<span class="font-bold text-emerald-600 dark:text-emerald-400">{scouted} scouted</span>
					&nbsp;•&nbsp;
					<span class="font-bold text-amber-600 dark:text-amber-400">{unscouted} remaining</span>
					&nbsp;of {teams.length} teams
				</p>
			</div>

			<!-- Filter Input -->
			<div class="relative w-full sm:w-60">
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
					placeholder="Search team #…"
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

		<!-- Progress Bar -->
		<div class="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
			<div
				class="h-full rounded-full bg-cyan-500 transition-all duration-500"
				style="width: {pct}%"
			></div>
		</div>
	</div>

	{#if teams.length > 0}
		<div
			class="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:divide-slate-800 dark:border-slate-800/80 dark:bg-slate-900"
		>
			{#each filteredTeams as team (team.number)}
				<div
					class="flex items-center justify-between p-3.5 transition-colors hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20"
				>
					<div class="flex items-center gap-3">
						<span
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
							{team.pitScouted
								? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
								: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}"
						>
							{#if team.pitScouted}
								✓
							{:else}
								○
							{/if}
						</span>
						<div>
							<div class="flex items-center gap-2">
								<a
									href={resolve('/teams/[teamnum]', { teamnum: String(team.number) })}
									class="font-mono text-sm font-black text-cyan-600 hover:underline dark:text-cyan-400"
								>
									Team {team.number}
								</a>
								<span class="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
									{team.name}
								</span>
							</div>
							<p class="text-[11px] text-slate-400">
								{team.pitScouted ? 'Pit data recorded' : 'Awaiting pit inspection'}
							</p>
						</div>
					</div>

					<div>
						{#if team.pitScouted}
							<a
								href={resolve('/teams/[teamnum]', { teamnum: String(team.number) })}
								class="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
							>
								View Specs
							</a>
						{:else}
							<a
								href={`${resolve('/pit-scout/new')}?team=${encodeURIComponent(team.number)}`}
								rel="external"
								class="inline-flex items-center rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-cyan-700 active:bg-cyan-800"
							>
								Scout →
							</a>
						{/if}
					</div>
				</div>
			{/each}

			{#if filteredTeams.length === 0}
				<div class="p-8 text-center text-xs text-slate-400 italic">
					No teams match "{searchFilter}".
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
		>
			<p class="text-sm font-semibold text-slate-600 dark:text-slate-300">
				No teams available to pit scout.
			</p>
			<p class="mt-1 text-xs text-slate-400">
				Import team lists from The Blue Alliance in the Admin dashboard.
			</p>
			<div class="mt-4">
				<a
					href={resolve('/admin')}
					class="inline-flex items-center rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-cyan-700"
				>
					Open Admin Dashboard →
				</a>
			</div>
		</div>
	{/if}
</div>
