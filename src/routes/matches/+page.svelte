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

<div class="mx-auto max-w-7xl space-y-4 sm:space-y-6">
	<!-- Page Header & Match Selector -->
	<div class="border-b border-slate-200/80 pb-4 sm:pb-5 dark:border-slate-800/80">
		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
			<div>
				<h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
					Match Analysis
				</h1>
				<p class="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
					Pre-match alliance predictions, win probability, and robot scouting breakdowns.
				</p>
			</div>

			<!-- Match Dropdown Picker -->
			<div class="relative w-full sm:w-auto" bind:this={pickerEl}>
				<div class="flex w-full items-center gap-2">
					<button
						type="button"
						onclick={() => {
							pickerOpen = !pickerOpen;
							if (pickerOpen) {
								filterText = '';
								setTimeout(() => filterInputEl?.focus(), 30);
							}
						}}
						class="flex flex-1 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs transition-colors hover:border-cyan-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:w-60 sm:flex-initial dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
					>
						{#if selectedMatch}
							<span>{matchFullLabel(selectedMatch)}</span>
						{:else}
							<span class="text-slate-400">Select match…</span>
						{/if}
						<svg
							class="h-4 w-4 shrink-0 text-slate-400 transition-transform {pickerOpen
								? 'rotate-180'
								: ''}"
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
							class="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-cyan-700 shadow-2xs transition-colors hover:bg-cyan-50 dark:border-slate-800 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-cyan-950/40"
						>
							Reports ↗
						</a>
					{/if}
				</div>

				<!-- Match Dropdown Menu -->
				{#if pickerOpen}
					<div
						class="absolute top-full left-0 z-50 mt-1.5 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl backdrop-blur-md sm:right-0 sm:left-auto sm:w-72 dark:border-slate-800 dark:bg-slate-900"
					>
						<div class="p-1.5">
							<input
								bind:this={filterInputEl}
								bind:value={filterText}
								type="text"
								placeholder="Search match #…"
								class="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
							/>
						</div>
						<div class="max-h-72 overflow-y-auto py-1">
							{#each filteredMatchGroups as group}
								{#if group.matches.length > 0}
									<p
										class="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase"
									>
										{group.label}
									</p>
									{#each group.matches as m}
										<button
											type="button"
											onclick={() => selectMatch(m.id)}
											class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-cyan-50 active:bg-cyan-100 dark:hover:bg-cyan-950/40 {selectedMatchId ===
											m.id
												? 'bg-cyan-50 dark:bg-cyan-950/60'
												: ''}"
										>
											<span
												class="min-w-[2.5rem] rounded px-1.5 py-0.5 text-center font-mono font-bold {matchTypeColor(
													m.matchType
												)}"
											>
												{matchShortLabel(m)}
											</span>
											<span class="font-medium text-slate-700 dark:text-slate-200">
												{matchFullLabel(m)}
											</span>
										</button>
									{/each}
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Team 2718 Quick Matches (No ring clipping, smooth scroll) -->
		{#if data.ourMatches?.length > 0}
			<div class="mt-3 flex items-center gap-1.5 overflow-x-auto pt-1 pb-1.5">
				<span class="shrink-0 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
					Team 2718:
				</span>
				{#each sortedOurMatches as m}
					<a
						href="/matches?match={encodeURIComponent(m.id)}"
						class="shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition-all
							{data.matchId === m.id
							? 'bg-cyan-600 text-white shadow-2xs'
							: m.matchType === 'qualification'
								? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300'
								: m.matchType === 'playoff'
									? 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300'
									: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300'}"
					>
						{matchShortLabel(m)}
					</a>
				{/each}
			</div>
		{/if}
	</div>

	{#if data.error}
		<div
			class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
		>
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

		<!-- Match Prediction Summary Card -->
		{#if hasEpopPred}
			<div
				class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
			>
				<div class="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
					<!-- Red Alliance Score Header -->
					<div class="p-4 sm:p-5">
						<div class="flex items-center justify-between">
							<span
								class="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-rose-600 dark:text-rose-400"
							>
								<span class="h-2 w-2 rounded-full bg-rose-500"></span>
								RED ALLIANCE
							</span>
						</div>

						<div class="mt-2.5 grid grid-cols-2 gap-3">
							<div>
								<p class="text-[11px] font-medium text-slate-400">Predicted ePOP</p>
								<p class="font-mono text-xl font-bold text-rose-600 sm:text-2xl dark:text-rose-400">
									{redEpopPred.toFixed(1)}
								</p>
							</div>
							{#if data.match?.redScore != null}
								<div>
									<p class="text-[11px] font-medium text-slate-400">Final Score</p>
									<p
										class="font-mono text-xl font-bold text-slate-800 sm:text-2xl dark:text-slate-200"
									>
										{data.match.redScore}
									</p>
								</div>
							{/if}
						</div>

						{#if redAutoPred > 0}
							<div
								class="mt-2.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400"
							>
								<span class="text-slate-400">Auto Pred:</span>
								<span class="font-mono font-bold">{redAutoPred.toFixed(1)} fuel</span>
							</div>
						{/if}
					</div>

					<!-- Blue Alliance Score Header -->
					<div class="p-4 sm:p-5">
						<div class="flex items-center justify-between">
							<span
								class="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-blue-600 dark:text-blue-400"
							>
								<span class="h-2 w-2 rounded-full bg-blue-500"></span>
								BLUE ALLIANCE
							</span>
						</div>

						<div class="mt-2.5 grid grid-cols-2 gap-3">
							<div>
								<p class="text-[11px] font-medium text-slate-400">Predicted ePOP</p>
								<p class="font-mono text-xl font-bold text-blue-600 sm:text-2xl dark:text-blue-400">
									{blueEpopPred.toFixed(1)}
								</p>
							</div>
							{#if data.match?.blueScore != null}
								<div>
									<p class="text-[11px] font-medium text-slate-400">Final Score</p>
									<p
										class="font-mono text-xl font-bold text-slate-800 sm:text-2xl dark:text-slate-200"
									>
										{data.match.blueScore}
									</p>
								</div>
							{/if}
						</div>

						{#if blueAutoPred > 0}
							<div
								class="mt-2.5 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400"
							>
								<span class="text-slate-400">Auto Pred:</span>
								<span class="font-mono font-bold">{blueAutoPred.toFixed(1)} fuel</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Win Probability Bar -->
				<div
					class="border-t border-slate-100 bg-slate-50/50 p-3.5 sm:p-4 dark:border-slate-800 dark:bg-slate-800/30"
				>
					<div class="mb-1.5 flex items-center justify-between text-xs font-bold">
						<span class="font-mono text-rose-600 dark:text-rose-400">
							Red {(winProbRed * 100).toFixed(0)}%
						</span>
						<span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
							Win Probability
						</span>
						<span class="font-mono text-blue-600 dark:text-blue-400">
							Blue {(winProbBlue * 100).toFixed(0)}%
						</span>
					</div>
					<div
						class="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
					>
						<div
							class="absolute inset-y-0 left-0 rounded-l-full bg-rose-500 transition-all duration-500"
							style="width: {(winProbRed * 100).toFixed(1)}%"
						></div>
						<div
							class="absolute inset-y-0 right-0 rounded-r-full bg-blue-500 transition-all duration-500"
							style="width: {(winProbBlue * 100).toFixed(1)}%"
						></div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Alliance Team Comparison Cards -->
		<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
			<!-- Red Alliance Column -->
			<div class="space-y-3">
				<h2
					class="flex items-center gap-2 text-xs font-black tracking-wider text-rose-600 uppercase dark:text-rose-400"
				>
					<span class="h-2 w-2 rounded-full bg-rose-500"></span>
					Red Alliance Robots
				</h2>
				<div class="space-y-3">
					{#each data.matchTeams.red as team}
						{@render teamCard(team, 'red')}
					{/each}
					{#if data.matchTeams.red.length === 0}
						<div
							class="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 italic dark:border-slate-800"
						>
							No red alliance teams scheduled.
						</div>
					{/if}
				</div>
			</div>

			<!-- Blue Alliance Column -->
			<div class="space-y-3">
				<h2
					class="flex items-center gap-2 text-xs font-black tracking-wider text-blue-600 uppercase dark:text-blue-400"
				>
					<span class="h-2 w-2 rounded-full bg-blue-500"></span>
					Blue Alliance Robots
				</h2>
				<div class="space-y-3">
					{#each data.matchTeams.blue as team}
						{@render teamCard(team, 'blue')}
					{/each}
					{#if data.matchTeams.blue.length === 0}
						<div
							class="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 italic dark:border-slate-800"
						>
							No blue alliance teams scheduled.
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else if !data.matchId}
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
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
					/>
				</svg>
			</div>
			<h3 class="mt-4 text-base font-bold text-slate-800 dark:text-white">
				Select a match to view pre-match analysis
			</h3>
			<p class="mt-1 text-xs text-slate-400">
				Choose any match from the dropdown above or pick a Team 2718 match pill.
			</p>
		</div>
	{/if}
</div>

{#snippet teamCard(
	team: NonNullable<typeof data.matchTeams>['red'][number],
	alliance: 'red' | 'blue'
)}
	{@const borderAccent = alliance === 'red' ? 'border-l-rose-500' : 'border-l-blue-500'}
	{@const textAccent =
		alliance === 'red' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}
	<div
		class="overflow-hidden rounded-2xl border border-l-4 border-slate-200/80 {borderAccent} bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
	>
		<!-- Team Header -->
		<div
			class="flex items-center justify-between border-b border-slate-100 bg-slate-50/75 px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50"
		>
			<div class="flex items-center gap-2">
				<a
					href="/teams/{team.number}"
					class="font-mono text-base font-black {textAccent} hover:underline"
				>
					{team.number}
				</a>
				<span class="truncate font-semibold text-slate-700 dark:text-slate-300">{team.name}</span>
			</div>
			<div class="flex items-center gap-1.5">
				{#if team.epop != null}
					<span
						class="rounded-md bg-purple-50 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300"
					>
						ePOP {team.epop.toFixed(1)}
					</span>
				{/if}
				{#if team.reportCount > 0}
					<span
						class="rounded-md bg-cyan-50 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
					>
						{team.reportCount} Reps
					</span>
				{/if}
			</div>
		</div>

		{#if team.reportCount > 0}
			<!-- Scouting Stats -->
			<div
				class="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 p-2.5 text-center text-xs dark:divide-slate-800 dark:border-slate-800"
			>
				<div>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Fuel</p>
					<p class="font-mono text-sm font-bold text-cyan-600 dark:text-cyan-400">
						{team.fuelPercent > 0 ? `${fmt1(team.avgTeleFuelScore)}/5` : '—'}
					</p>
				</div>
				<div>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Defense</p>
					<p class="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
						{team.avgDefScore != null ? `${team.avgDefScore.toFixed(1)}/5` : '—'}
					</p>
				</div>
				<div>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Passing</p>
					<p class="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
						{team.avgPassScore != null ? `${team.avgPassScore.toFixed(1)}/5` : '—'}
					</p>
				</div>
			</div>

			<div
				class="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 p-2.5 text-center text-xs dark:divide-slate-800 dark:border-slate-800"
			>
				<div>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Auto Fuel</p>
					<p class="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
						{fmt1(team.avgAutoFuel)}
					</p>
				</div>
				<div>
					<p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Climb %</p>
					<div
						class="flex justify-center gap-1.5 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400"
					>
						<span>L1:{team.climbL1Pct}%</span>
						<span>L2:{team.climbL2Pct}%</span>
						<span>L3:{team.climbL3Pct}%</span>
					</div>
				</div>
			</div>
		{/if}

		{#if team.pit}
			<div class="bg-slate-50/50 p-2.5 text-[11px] dark:bg-slate-800/30">
				<div class="flex items-center justify-between text-slate-500 dark:text-slate-400">
					<span
						>Drive: <b class="text-slate-800 dark:text-slate-200"
							>{team.pit.data?.drivetrain ?? '—'}</b
						></span
					>
					<span
						>Shooter: <b class="text-slate-800 dark:text-slate-200"
							>{team.pit.data?.shooterType ?? '—'}</b
						></span
					>
					<span
						>Trench: <b class="text-slate-800 dark:text-slate-200"
							>{team.canGoUnderTrench ? 'Yes' : 'No'}</b
						></span
					>
				</div>
			</div>
		{/if}

		{#if team.reportCount === 0 && !team.pit}
			<div class="p-4 text-center text-xs text-slate-400 italic">
				No scouting data available yet for this team.
			</div>
		{/if}
	</div>
{/snippet}
