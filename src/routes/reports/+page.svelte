<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	import { ChevronRightOutline } from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';
	import { matchFullLabel, matchTypeColorBorder, playoffKey } from '$lib/matchUtils';

	let { data } = $props();

	const reports = $derived(data?.reports ?? []);
	const matches = $derived(data?.matches ?? []);

	const reportedTeamsForMatch = (matchId: string): Set<number> =>
		new Set(reports.filter((r) => r.matchId === matchId).map((r) => r.teamNumber));

	const teamsByAllianceFromReports = (matchId: string, alliance: number): (number | null)[] =>
		[...new Set(
			reports
				.filter((r) => r.matchId === matchId && r.data?.alliance === alliance)
				.map((r) => r.teamNumber)
		)];

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
		return [...nonPlayoff, ...playoff];
	});
</script>

<div class="mx-auto mt-px max-w-5xl px-4 py-4">
	<Heading tag="h1" class="mb-4 text-3xl font-bold">Reports</Heading>

	{#if matches.length > 0}
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
			<!-- Header row -->
			<div class="grid grid-cols-[3.5rem_1fr_auto_1fr_1.5rem] items-center border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase sm:grid-cols-[5rem_1fr_auto_1fr_2rem]">
				<span>Match</span>
				<span class="text-center text-red-400">Red Alliance</span>
				<span></span>
				<span class="text-center text-blue-400">Blue Alliance</span>
				<span></span>
			</div>

			{#each sortedMatches as match, i}
				{@const reported = reportedTeamsForMatch(match.id)}
				{@const redScheduled = hasRedSchedule(match)}
				{@const blueScheduled = hasBlueSchedule(match)}
				{@const red = redScheduled
					? [match.red1, match.red2, match.red3]
					: teamsByAllianceFromReports(match.id, 0)}
				{@const blue = blueScheduled
					? [match.blue1, match.blue2, match.blue3]
					: teamsByAllianceFromReports(match.id, 1)}

				<div class="flex items-stretch {i > 0 ? 'border-t border-gray-100' : ''}">
					<a
						href="/reports/{match.id}"
						class="flex-1 grid grid-cols-[3.5rem_1fr_auto_1fr_1.5rem] items-center gap-x-1 px-3 py-2 transition-colors hover:bg-gray-50 sm:grid-cols-[5rem_1fr_auto_1fr_2rem] sm:gap-x-2"
					>
						<!-- Match label -->
						<span class="inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-xs font-bold {matchTypeColorBorder(match.matchType)}">
							{matchFullLabel(match)}
						</span>

						<!-- Red alliance -->
						<div class="flex flex-wrap justify-center gap-1">
							{#each red as team}
								{#if team != null}
									{@const hasReport = reported.has(team)}
									<span class="relative inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold
										{hasReport ? 'bg-red-100 text-red-700' : redScheduled ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-300' : 'bg-red-100 text-red-700'}">
										{team}
										{#if redScheduled && !hasReport}
											<span class="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-orange-400"></span>
										{/if}
									</span>
								{:else if redScheduled}
									<span class="inline-flex items-center justify-center rounded border border-dashed border-gray-200 px-1.5 py-0.5 text-xs text-gray-300">—</span>
								{/if}
							{/each}
							{#if red.length === 0}
								<span class="text-xs text-gray-300 italic">No data</span>
							{/if}
						</div>

						<!-- VS -->
						<span class="text-[10px] font-black text-gray-300">VS</span>

						<!-- Blue alliance -->
						<div class="flex flex-wrap justify-center gap-1">
							{#each blue as team}
								{#if team != null}
									{@const hasReport = reported.has(team)}
									<span class="relative inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold
										{hasReport ? 'bg-blue-100 text-blue-700' : blueScheduled ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-300' : 'bg-blue-100 text-blue-700'}">
										{team}
										{#if blueScheduled && !hasReport}
											<span class="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-orange-400"></span>
										{/if}
									</span>
								{:else if blueScheduled}
									<span class="inline-flex items-center justify-center rounded border border-dashed border-gray-200 px-1.5 py-0.5 text-xs text-gray-300">—</span>
								{/if}
							{/each}
							{#if blue.length === 0}
								<span class="text-xs text-gray-300 italic">No data</span>
							{/if}
						</div>

						<!-- Chevron -->
						<ChevronRightOutline class="h-3.5 w-3.5 text-gray-300" />
					</a>

					{#if data.isAdmin}
						<form method="POST" action="?/deleteMatch" use:enhance class="flex items-center border-l border-gray-100 px-2">
							<input type="hidden" name="id" value={match.id} />
							<button type="submit"
								class="rounded bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-100">
								Delete
							</button>
						</form>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-gray-500">No matches in the schedule yet.</p>
	{/if}
</div>
