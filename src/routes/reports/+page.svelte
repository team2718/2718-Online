<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { matchFullLabel, matchTypeColorBorder, playoffKey } from '$lib/matchUtils';

	let { data } = $props();

	const reports = $derived(data?.reports ?? []);
	const matches = $derived(data?.matches ?? []);

	let searchFilter = $state('');

	const reportedTeamsForMatch = (matchId: string): Set<number> =>
		new Set(reports.filter((r) => r.matchId === matchId).map((r) => r.teamNumber));

	const teamsByAllianceFromReports = (matchId: string, alliance: number): (number | null)[] => [
		...new Set(
			reports
				.filter((r) => r.matchId === matchId && r.data?.alliance === alliance)
				.map((r) => r.teamNumber)
		)
	];

	const hasRedSchedule = (match: (typeof matches)[number]): boolean =>
		match.red1 != null || match.red2 != null || match.red3 != null;

	const hasBlueSchedule = (match: (typeof matches)[number]): boolean =>
		match.blue1 != null || match.blue2 != null || match.blue3 != null;

	const typeOrder: Record<string, number> = { practice: 0, qualification: 1 };

	const sortedMatches = $derived.by(() => {
		const nonPlayoff = [...matches]
			.filter((m) => m.matchType !== 'playoff')
			.sort((a, b) => {
				const ta = typeOrder[a.matchType ?? ''] ?? 99;
				const tb = typeOrder[b.matchType ?? ''] ?? 99;
				return ta !== tb ? ta - tb : a.matchNumber - b.matchNumber;
			});
		const playoff = [...matches]
			.filter((m) => m.matchType === 'playoff')
			.sort((a, b) => playoffKey(a.id) - playoffKey(b.id));

		const all = [...nonPlayoff, ...playoff];
		const q = searchFilter.trim().toLowerCase();
		if (!q) return all;
		return all.filter(
			(m) => m.id.toLowerCase().includes(q) || matchFullLabel(m).toLowerCase().includes(q)
		);
	});
</script>

<div class="mx-auto max-w-5xl space-y-4 sm:space-y-6">
	<!-- Header & Search Filter -->
	<div
		class="flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end dark:border-slate-800/80"
	>
		<div>
			<div class="flex items-center gap-2.5">
				<h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
					Match Reports
				</h1>
				<span
					class="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
				>
					{reports.length} Total Logs
				</span>
			</div>
			<p class="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
				Browse individual robot scouting observations by match.
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
				placeholder="Filter match #…"
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

	{#if sortedMatches.length > 0}
		<div
			class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
		>
			<!-- Header row -->
			<div
				class="grid grid-cols-[4.5rem_1fr_auto_1fr_1.5rem] items-center border-b border-slate-100 bg-slate-50/75 px-3 py-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase sm:grid-cols-[6rem_1fr_auto_1fr_2rem] dark:border-slate-800 dark:bg-slate-800/50"
			>
				<span>Match</span>
				<span class="text-center text-rose-500 dark:text-rose-400">Red Alliance</span>
				<span></span>
				<span class="text-center text-blue-500 dark:text-blue-400">Blue Alliance</span>
				<span></span>
			</div>

			<div class="divide-y divide-slate-100 dark:divide-slate-800">
				{#each sortedMatches as match (match.id)}
					{@const reported = reportedTeamsForMatch(match.id)}
					{@const redScheduled = hasRedSchedule(match)}
					{@const blueScheduled = hasBlueSchedule(match)}
					{@const red = redScheduled
						? [match.red1, match.red2, match.red3]
						: teamsByAllianceFromReports(match.id, 0)}
					{@const blue = blueScheduled
						? [match.blue1, match.blue2, match.blue3]
						: teamsByAllianceFromReports(match.id, 1)}

					<div class="flex items-stretch">
						<a
							href={resolve('/reports/[matchId]', { matchId: match.id })}
							class="grid flex-1 grid-cols-[4.5rem_1fr_auto_1fr_1.5rem] items-center gap-x-1.5 px-3 py-3 transition-colors hover:bg-cyan-50/50 active:bg-cyan-50 sm:grid-cols-[6rem_1fr_auto_1fr_2rem] sm:gap-x-2 dark:hover:bg-cyan-950/20"
						>
							<!-- Match label -->
							<span
								class="inline-flex items-center justify-center rounded-lg border px-2 py-0.5 font-mono text-xs font-bold {matchTypeColorBorder(
									match.matchType
								)}"
							>
								{matchFullLabel(match)}
							</span>

							<!-- Red alliance -->
							<div class="flex flex-wrap justify-center gap-1">
								{#each red as team, idx (team != null ? team : `r-${idx}`)}
									{#if team != null}
										{@const hasReport = reported.has(team)}
										<span
											class="relative inline-flex items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-xs font-bold
											{hasReport
												? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
												: redScheduled
													? 'bg-amber-50 text-amber-600 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-400'
													: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}"
										>
											{team}
											{#if redScheduled && !hasReport}
												<span
													class="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-500"
												></span>
											{/if}
										</span>
									{:else if redScheduled}
										<span
											class="inline-flex items-center justify-center rounded border border-dashed border-slate-200 px-1.5 py-0.5 text-xs text-slate-300 dark:border-slate-700 dark:text-slate-600"
										>
											—
										</span>
									{/if}
								{/each}
							</div>

							<!-- VS -->
							<span class="font-mono text-[10px] font-black text-slate-300 dark:text-slate-600"
								>VS</span
							>

							<!-- Blue alliance -->
							<div class="flex flex-wrap justify-center gap-1">
								{#each blue as team, idx (team != null ? team : `b-${idx}`)}
									{#if team != null}
										{@const hasReport = reported.has(team)}
										<span
											class="relative inline-flex items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-xs font-bold
											{hasReport
												? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
												: blueScheduled
													? 'bg-amber-50 text-amber-600 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-400'
													: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}"
										>
											{team}
											{#if blueScheduled && !hasReport}
												<span
													class="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-500"
												></span>
											{/if}
										</span>
									{:else if blueScheduled}
										<span
											class="inline-flex items-center justify-center rounded border border-dashed border-slate-200 px-1.5 py-0.5 text-xs text-slate-300 dark:border-slate-700 dark:text-slate-600"
										>
											—
										</span>
									{/if}
								{/each}
							</div>

							<svg
								class="h-4 w-4 text-slate-300 transition-colors group-hover:text-cyan-500 dark:text-slate-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
							</svg>
						</a>

						{#if data.isAdmin}
							<form
								method="POST"
								action="?/deleteMatch"
								use:enhance
								class="flex items-center border-l border-slate-100 px-2 dark:border-slate-800"
							>
								<input type="hidden" name="id" value={match.id} />
								<button
									type="submit"
									class="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
								>
									Delete
								</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div
			class="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
		>
			<p class="text-xs text-slate-400">No match reports found.</p>
		</div>
	{/if}
</div>
