<script lang="ts">
	import { Heading } from 'flowbite-svelte';
	import { ChevronRightOutline } from 'flowbite-svelte-icons';

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

	const hasSchedule = (match: (typeof matches)[number]): boolean =>
		match.red1 != null || match.red2 != null || match.red3 != null ||
		match.blue1 != null || match.blue2 != null || match.blue3 != null;

	const matchLabel = (match: (typeof matches)[number]): string => {
		if (match.matchType === 'qualification') return `Q${match.matchNumber}`;
		if (match.matchType === 'practice') return `P${match.matchNumber}`;
		if (match.matchType === 'playoff') return match.id.toUpperCase();
		return `M${match.matchNumber}`;
	};

	const typeColor = (t: string | null) => {
		if (t === 'qualification') return 'text-green-700 bg-green-50 border-green-200';
		if (t === 'practice') return 'text-yellow-700 bg-yellow-50 border-yellow-200';
		if (t === 'playoff') return 'text-purple-700 bg-purple-50 border-purple-200';
		return 'text-gray-600 bg-gray-50 border-gray-200';
	};
</script>

<div class="mx-auto mt-px max-w-5xl px-4 py-4">
	<Heading tag="h1" class="mb-4 text-3xl font-bold">Matches</Heading>

	{#if matches.length > 0}
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
			<!-- Header row -->
			<div class="grid grid-cols-[5rem_1fr_auto_1fr_2rem] items-center border-b border-gray-200 bg-gray-50 px-3 py-1.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
				<span>Match</span>
				<span class="text-center text-red-400">Red Alliance</span>
				<span></span>
				<span class="text-center text-blue-400">Blue Alliance</span>
				<span></span>
			</div>

			{#each matches as match, i}
				{@const reported = reportedTeamsForMatch(match.id)}
				{@const scheduled = hasSchedule(match)}
				{@const red = scheduled
					? [match.red1, match.red2, match.red3]
					: teamsByAllianceFromReports(match.id, 0)}
				{@const blue = scheduled
					? [match.blue1, match.blue2, match.blue3]
					: teamsByAllianceFromReports(match.id, 1)}

				<a
					href="/matches/{match.id}"
					class="grid grid-cols-[5rem_1fr_auto_1fr_2rem] items-center gap-x-2 px-3 py-2 transition-colors hover:bg-gray-50
						{i > 0 ? 'border-t border-gray-100' : ''}"
				>
					<!-- Match label -->
					<span class="inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-xs font-bold {typeColor(match.matchType)}">
						{matchLabel(match)}
					</span>

					<!-- Red alliance -->
					<div class="flex justify-center gap-1">
						{#each red as team}
							{#if team != null}
								{@const hasReport = reported.has(team)}
								<span class="relative inline-flex min-w-[3.5rem] items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold
									{hasReport ? 'bg-red-100 text-red-700' : scheduled ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-300' : 'bg-red-100 text-red-700'}">
									{team}
									{#if scheduled && !hasReport}
										<span class="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-orange-400"></span>
									{/if}
								</span>
							{:else if scheduled}
								<span class="inline-flex min-w-[3.5rem] items-center justify-center rounded border border-dashed border-gray-200 px-1.5 py-0.5 text-xs text-gray-300">—</span>
							{/if}
						{/each}
						{#if red.length === 0}
							<span class="text-xs text-gray-300 italic">No data</span>
						{/if}
					</div>

					<!-- VS -->
					<span class="text-[10px] font-black text-gray-300">VS</span>

					<!-- Blue alliance -->
					<div class="flex justify-center gap-1">
						{#each blue as team}
							{#if team != null}
								{@const hasReport = reported.has(team)}
								<span class="relative inline-flex min-w-[3.5rem] items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold
									{hasReport ? 'bg-blue-100 text-blue-700' : scheduled ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-300' : 'bg-blue-100 text-blue-700'}">
									{team}
									{#if scheduled && !hasReport}
										<span class="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-orange-400"></span>
									{/if}
								</span>
							{:else if scheduled}
								<span class="inline-flex min-w-[3.5rem] items-center justify-center rounded border border-dashed border-gray-200 px-1.5 py-0.5 text-xs text-gray-300">—</span>
							{/if}
						{/each}
						{#if blue.length === 0}
							<span class="text-xs text-gray-300 italic">No data</span>
						{/if}
					</div>

					<!-- Chevron -->
					<ChevronRightOutline class="h-3.5 w-3.5 text-gray-300" />
				</a>
			{/each}
		</div>
	{:else}
		<p class="text-gray-500">No matches in the schedule yet.</p>
	{/if}
</div>
