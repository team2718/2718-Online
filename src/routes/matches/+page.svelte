<script lang="ts">
	import { goto } from '$app/navigation';
	import { matchShortLabel, matchFullLabel, matchTypeColor, playoffKey } from '$lib/matchUtils';
	import { winProbability } from '$lib/winProb';

	let { data } = $props();

	let selectedMatchId = $state('');
	let pickerOpen = $state(false);
	let filterText = $state('');
	let pickerEl: HTMLElement | undefined;
	let filterInputEl = $state<HTMLInputElement | undefined>(undefined);

	// Keep selectedMatchId in sync with the URL when navigating via quick-links.
	$effect(() => {
		selectedMatchId = data.matchId ?? '';
	});

	function selectMatch(id: string) {
		selectedMatchId = id;
		pickerOpen = false;
		if (id) goto(`/matches?match=${encodeURIComponent(id)}`);
		else goto('/matches');
	}

	const fmt1 = (v: number | null) => (v == null ? '—' : v.toFixed(1));

	const selectedMatch = $derived(data.allMatches.find((m) => m.id === selectedMatchId) ?? null);

	const sortedOurMatches = $derived.by(() => {
		const qual = data.ourMatches
			.filter((m) => m.matchType === 'qualification')
			.sort((a, b) => a.matchNumber - b.matchNumber);
		const playoff = data.ourMatches
			.filter((m) => m.matchType === 'playoff')
			.sort((a, b) => playoffKey(a.id) - playoffKey(b.id));
		const other = data.ourMatches.filter(
			(m) => m.matchType !== 'qualification' && m.matchType !== 'playoff'
		);
		return [...qual, ...playoff, ...other];
	});

	const filteredMatchGroups = $derived.by(() => {
		const q = filterText.trim().toLowerCase();
		const filter = (ms: typeof data.allMatches) =>
			q
				? ms.filter(
						(m) =>
							m.id.toLowerCase().includes(q) ||
							matchShortLabel(m).toLowerCase().includes(q) ||
							matchFullLabel(m).toLowerCase().includes(q)
					)
				: ms;
		const practice = filter(
			data.allMatches
				.filter((m) => m.matchType === 'practice')
				.sort((a, b) => a.matchNumber - b.matchNumber)
		);
		const qual = filter(
			data.allMatches
				.filter((m) => m.matchType === 'qualification')
				.sort((a, b) => a.matchNumber - b.matchNumber)
		);
		const playoff = filter(
			data.allMatches
				.filter((m) => m.matchType === 'playoff')
				.sort((a, b) => playoffKey(a.id) - playoffKey(b.id))
		);
		return [
			{ type: 'practice', label: 'Practice', matches: practice },
			{ type: 'qualification', label: 'Qualification', matches: qual },
			{ type: 'playoff', label: 'Playoff', matches: playoff }
		];
	});

	$effect(() => {
		if (!pickerOpen) return;
		function handleClick(e: MouseEvent) {
			if (!pickerEl?.contains(e.target as Node)) pickerOpen = false;
		}
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	});
</script>

<div class="mx-auto max-w-7xl py-6">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-black tracking-tight text-gray-900">Match Analysis</h1>
	</div>

	<!-- Our matches quick links -->
	{#if data.ourMatches?.length > 0}
		<div class="mb-6">
			<p class="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">Team 2718 Matches</p>
			<div class="flex flex-wrap gap-2">
				{#each sortedOurMatches as m}
					<a
						href="/matches?match={encodeURIComponent(m.id)}"
						class="rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors
							{m.matchType === 'qualification' ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' :
							 m.matchType === 'practice' ? 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' :
							 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'}
							{data.matchId === m.id ? 'ring-2 ring-offset-1 ring-current' : ''}"
					>
						{matchFullLabel(m)}
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Match picker -->
	<div class="relative mb-8" bind:this={pickerEl}>
		<p class="mb-1.5 text-sm font-semibold text-gray-700">Match</p>
		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={() => {
					pickerOpen = !pickerOpen;
					if (pickerOpen) {
						filterText = '';
						setTimeout(() => filterInputEl?.focus(), 30);
					}
				}}
				class="flex w-56 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
			>
				{#if selectedMatch}
					<span class="font-bold text-gray-800">{matchFullLabel(selectedMatch)}</span>
				{:else}
					<span class="text-gray-400">Select a match…</span>
				{/if}
				<svg
					class="h-4 w-4 shrink-0 text-gray-400 transition-transform {pickerOpen ? 'rotate-180' : ''}"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			{#if selectedMatch}
				<a
					href="/reports/{selectedMatch.id}"
					class="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
				>
					Reports <span class="text-blue-400">↗</span>
				</a>
			{/if}
		</div>

		{#if pickerOpen}
			<div class="absolute left-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
				<!-- Search -->
				<div class="border-b border-gray-100 p-2">
					<input
						bind:this={filterInputEl}
						bind:value={filterText}
						type="text"
						placeholder="Filter matches…"
						class="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
					/>
				</div>
				<!-- Match list -->
				<div class="max-h-72 overflow-y-auto py-1">
					{#each filteredMatchGroups as group}
						{#if group.matches.length > 0}
							<p class="px-3 pb-0.5 pt-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
								{group.label}
							</p>
							{#each group.matches as m}
								<button
									type="button"
									onclick={() => selectMatch(m.id)}
									class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50 {selectedMatchId === m.id ? 'bg-blue-50' : ''}"
								>
									<span class="min-w-[2.5rem] rounded px-1.5 py-0.5 text-center text-xs font-bold {matchTypeColor(m.matchType)}">
										{matchShortLabel(m)}
									</span>
									<span class="font-medium {selectedMatchId === m.id ? 'text-blue-700' : 'text-gray-700'}">
										{matchFullLabel(m)}
									</span>
								</button>
							{/each}
						{/if}
					{/each}
					{#if filteredMatchGroups.every((g) => g.matches.length === 0)}
						<p class="py-4 text-center text-sm text-gray-400 italic">No matches found</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	{#if data.error}
		<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
			{data.error}
		</div>
	{:else if data.matchTeams}
		{@const redEpopPred = data.matchTeams.red.reduce((s, t) => s + (t.epop ?? 0), 0)}
		{@const blueEpopPred = data.matchTeams.blue.reduce((s, t) => s + (t.epop ?? 0), 0)}
		{@const redAutoPred = data.matchTeams.red.reduce((s, t) => s + (t.avgAutoFuel ?? 0), 0)}
		{@const blueAutoPred = data.matchTeams.blue.reduce((s, t) => s + (t.avgAutoFuel ?? 0), 0)}
		{@const hasEpopPred = redEpopPred > 0 || blueEpopPred > 0}
		{@const winProbRed = winProbability(redEpopPred, blueEpopPred)}
		{@const winProbBlue = 1 - winProbRed}
		{#if hasEpopPred}
			<div class="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<div class="border-b border-gray-100 bg-gray-50 px-4 py-2">
					<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Predictions</p>
				</div>
				<div class="grid grid-cols-2 divide-x divide-gray-100">
					<!-- Red -->
					<div class="px-4 py-3">
						<p class="mb-2 text-xs font-bold tracking-wider text-red-400 uppercase">Red Alliance</p>
						<div class="flex items-baseline gap-4">
							<div>
								<p class="text-2xl font-black text-red-600">{redEpopPred.toFixed(1)}</p>
								<p class="text-xs text-gray-400">ePOP Prediction</p>
							</div>
							{#if data.match?.redScore != null}
								<div>
									<p class="text-2xl font-black text-gray-700">{data.match.redScore}</p>
									<p class="text-xs text-gray-400">Actual Score</p>
								</div>
							{/if}
						</div>
						{#if redAutoPred > 0}
							<div class="mt-2 border-t border-gray-100 pt-2">
								<p class="text-lg font-bold text-red-600">{redAutoPred.toFixed(1)}</p>
								<p class="text-xs text-gray-400">Auto Fuel Prediction</p>
							</div>
						{/if}
					</div>
					<!-- Blue -->
					<div class="px-4 py-3">
						<p class="mb-2 text-xs font-bold tracking-wider text-blue-400 uppercase">Blue Alliance</p>
						<div class="flex items-baseline gap-4">
							<div>
								<p class="text-2xl font-black text-blue-600">{blueEpopPred.toFixed(1)}</p>
								<p class="text-xs text-gray-400">ePOP Prediction</p>
							</div>
							{#if data.match?.blueScore != null}
								<div>
									<p class="text-2xl font-black text-gray-700">{data.match.blueScore}</p>
									<p class="text-xs text-gray-400">Actual Score</p>
								</div>
							{/if}
						</div>
						{#if blueAutoPred > 0}
							<div class="mt-2 border-t border-gray-100 pt-2">
								<p class="text-lg font-bold text-blue-600">{blueAutoPred.toFixed(1)}</p>
								<p class="text-xs text-gray-400">Auto Fuel Prediction</p>
							</div>
						{/if}
					</div>
				</div>
				<!-- Win probability bar -->
				<div class="border-t border-gray-100 px-4 py-3">
					<p class="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">Win Probability</p>
					<div class="flex items-center gap-3">
						<span class="w-12 text-right text-sm font-black text-red-600">{(winProbRed * 100).toFixed(0)}%</span>
						<div class="relative h-4 flex-1 overflow-hidden rounded-full bg-gray-100">
							<div
								class="absolute inset-y-0 left-0 rounded-l-full bg-red-400 transition-all"
								style="width: {(winProbRed * 100).toFixed(1)}%"
							></div>
							<div
								class="absolute inset-y-0 right-0 rounded-r-full bg-blue-400 transition-all"
								style="width: {(winProbBlue * 100).toFixed(1)}%"
							></div>
						</div>
						<span class="w-12 text-sm font-black text-blue-600">{(winProbBlue * 100).toFixed(0)}%</span>
					</div>
				</div>
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Red Alliance -->
			<div>
				<div class="mb-3 flex items-center gap-2">
					<div class="h-3 w-3 rounded-full bg-red-500"></div>
					<h2 class="text-lg font-bold text-red-700">Red Alliance</h2>
				</div>
				<div class="space-y-4">
					{#each data.matchTeams.red as team}
						{@render teamCard(team, 'red')}
					{/each}
					{#if data.matchTeams.red.length === 0}
						<p class="text-sm text-gray-400 italic">No teams assigned.</p>
					{/if}
				</div>
			</div>

			<!-- Blue Alliance -->
			<div>
				<div class="mb-3 flex items-center gap-2">
					<div class="h-3 w-3 rounded-full bg-blue-500"></div>
					<h2 class="text-lg font-bold text-blue-700">Blue Alliance</h2>
				</div>
				<div class="space-y-4">
					{#each data.matchTeams.blue as team}
						{@render teamCard(team, 'blue')}
					{/each}
					{#if data.matchTeams.blue.length === 0}
						<p class="text-sm text-gray-400 italic">No teams assigned.</p>
					{/if}
				</div>
			</div>
		</div>
	{:else if !data.matchId}
		<div class="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
			<p class="text-lg font-bold text-gray-400">Select a match above to begin</p>
			<p class="mt-1 text-sm text-gray-400">Scouting data and pit info for all six robots will appear here.</p>
		</div>
	{/if}
</div>

{#snippet teamCard(team: NonNullable<typeof data.matchTeams>['red'][number], alliance: 'red' | 'blue')}
	{@const accentBorder = alliance === 'red' ? 'border-l-red-400' : 'border-l-blue-400'}
	{@const accentText = alliance === 'red' ? 'text-red-600' : 'text-blue-600'}
	<div class="overflow-hidden rounded-xl border border-gray-200 border-l-4 {accentBorder} bg-white shadow-sm">
		<!-- Team header -->
		<div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
			<div class="min-w-0 flex-1 mr-3 flex items-center gap-x-1.5">
				<a href="/teams/{team.number}" class="shrink-0 text-lg font-black {accentText} hover:underline">
					{team.number}
				</a>
				<span class="min-w-0 truncate text-sm font-semibold text-gray-600">{team.name}</span>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				{#if team.epop != null}
					<span class="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
						ePOP {team.epop.toFixed(1)}
					</span>
				{/if}
				{#if team.reportCount > 0}
					<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
						{team.reportCount} reports
					</span>
				{:else}
					<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">
						No scouting data
					</span>
				{/if}
			</div>
		</div>

		{#if team.reportCount > 0}
			<!-- Scouting stats -->
			<div class="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
				<div class="px-3 py-2.5 text-center">
					<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Fuel</p>
					{#if team.fuelPercent > 0}
						<p class="text-lg font-black text-cyan-600">
							{fmt1(team.avgTeleFuelScore)}<span class="text-xs font-normal text-gray-400">/5</span>
						</p>
						<p class="text-xs text-gray-400">{team.fuelPercent}% of matches</p>
					{:else}
						<p class="text-lg font-black text-gray-300">—</p>
						<p class="text-xs text-gray-400">Never scored fuel</p>
					{/if}
				</div>
				<div class="px-3 py-2.5 text-center">
					<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Defense</p>
					{#if team.avgDefScore != null}
						<p class="text-lg font-black text-orange-600">
							{team.avgDefScore.toFixed(1)}<span class="text-xs font-normal text-gray-400">/5</span>
						</p>
						<p class="text-xs text-gray-400">{team.defPercent}% of matches</p>
					{:else}
						<p class="text-lg font-black text-gray-300">—</p>
						<p class="text-xs text-gray-400">Never played defense</p>
					{/if}
				</div>
				<div class="px-3 py-2.5 text-center">
					<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Passing</p>
					{#if team.avgPassScore != null}
						<p class="text-lg font-black text-violet-600">
							{team.avgPassScore.toFixed(1)}<span class="text-xs font-normal text-gray-400">/5</span>
						</p>
						<p class="text-xs text-gray-400">{team.passPercent}% of matches</p>
					{:else}
						<p class="text-lg font-black text-gray-300">—</p>
						<p class="text-xs text-gray-400">Never passed</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
				<div class="px-3 py-2.5 text-center">
					<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Auto Fuel</p>
					<p class="text-xl font-black text-gray-900">{fmt1(team.avgAutoFuel)}</p>
				</div>
				<div class="px-3 py-2.5 text-center">
					<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Climb Ability</p>
					<div class="mt-1 flex flex-col items-center gap-1 text-xs">
						<p class="font-semibold {team.climbL1Pct > 0 ? 'text-gray-700' : 'text-gray-300'}">L1: {team.climbL1Pct}%</p>
						<p class="font-semibold {team.climbL2Pct > 0 ? 'text-gray-700' : 'text-gray-300'}">L2: {team.climbL2Pct}%</p>
						<p class="font-semibold {team.climbL3Pct > 0 ? 'text-gray-700' : 'text-gray-300'}">L3: {team.climbL3Pct}%</p>
					</div>
				</div>
			</div>
		{/if}

		{#if team.pit}
			<!-- Pit info -->
			<div class="px-4 py-3 bg-gray-50">
				<p class="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">Pit Scouting</p>
				<div class="grid grid-cols-3 gap-2 text-xs">
					<div>
						<span class="text-gray-400">Drive:</span>
						<span class="ml-1 font-semibold text-gray-700">{team.pit.data?.drivetrain ?? '—'}</span>
					</div>
					<div>
						<span class="text-gray-400">Shooter:</span>
						<span class="ml-1 font-semibold text-gray-700">{team.pit.data?.shooterType ?? '—'}</span>
					</div>
					<div>
						<span class="text-gray-400">Under Trench:</span>
						<span class="ml-1 font-semibold text-gray-700">{team.canGoUnderTrench ? 'Yes' : 'No'}</span>
					</div>
				</div>
			</div>
		{/if}

		{#if team.reportCount === 0 && !team.pit}
			<div class="px-4 py-4 text-center text-xs text-gray-400 italic">
				No scouting or pit data available for this team yet.
			</div>
		{/if}
	</div>
{/snippet}
