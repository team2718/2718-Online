<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { matchShortLabel, matchFullLabel, matchTypeColor, playoffKey } from '$lib/matchUtils';
	import { winProbability } from '$lib/winProb';

	let { data } = $props();

	const selectedMatchId = $derived(data.matchId ?? '');
	let pickerOpen = $state(false);
	let filterText = $state('');
	let pickerEl: HTMLElement | undefined;
	let filterInputEl = $state<HTMLInputElement | undefined>(undefined);

	function selectMatch(id: string) {
		pickerOpen = false;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		if (id) goto(`${resolve('/matches')}?match=${encodeURIComponent(id)}`);
		else goto(resolve('/matches'));
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

		return [
			{
				label: 'Practice',
				matches: filter(data.allMatches.filter((m) => m.matchType === 'practice'))
			},
			{
				label: 'Qualification',
				matches: filter(
					data.allMatches
						.filter((m) => m.matchType === 'qualification')
						.sort((a, b) => a.matchNumber - b.matchNumber)
				)
			},
			{
				label: 'Playoff',
				matches: filter(
					data.allMatches
						.filter((m) => m.matchType === 'playoff')
						.sort((a, b) => playoffKey(a.id) - playoffKey(b.id))
				)
			}
		];
	});

	$effect(() => {
		if (pickerOpen) {
			setTimeout(() => filterInputEl?.focus(), 50);
		} else {
			filterText = '';
		}
	});

	$effect(() => {
		function onClickOutside(e: MouseEvent) {
			if (pickerEl && !pickerEl.contains(e.target as Node)) {
				pickerOpen = false;
			}
		}
		if (pickerOpen) {
			document.addEventListener('click', onClickOutside);
			return () => document.removeEventListener('click', onClickOutside);
		}
	});

	// Probability computation
	const redEpopSum = $derived(
		data.matchTeams ? data.matchTeams.red.reduce((acc, t) => acc + (t.epop ?? 0), 0) : null
	);
	const blueEpopSum = $derived(
		data.matchTeams ? data.matchTeams.blue.reduce((acc, t) => acc + (t.epop ?? 0), 0) : null
	);

	const winProbRed = $derived(
		redEpopSum != null && blueEpopSum != null ? winProbability(redEpopSum, blueEpopSum) : 0.5
	);
	const winProbBlue = $derived(1 - winProbRed);
</script>

<div class="mx-auto max-w-7xl space-y-6">
	<!-- Top Bar: Match Picker & Quick Links -->
	<div class="border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
			<div>
				<h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
					Match Analysis
				</h1>
				<p class="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
					Pre-match scouting breakdown, ePOP predictions & telemetry
				</p>
			</div>

			<!-- Match Dropdown Selector -->
			<div class="relative w-full sm:w-auto" bind:this={pickerEl}>
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => (pickerOpen = !pickerOpen)}
						class="flex flex-1 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs transition-colors hover:border-cyan-400 sm:w-60 sm:flex-initial dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
					>
						<span class="truncate">
							{selectedMatch ? matchFullLabel(selectedMatch) : 'Select Match…'}
						</span>
						<svg
							class="h-4 w-4 shrink-0 text-slate-400 transition-transform {pickerOpen
								? 'rotate-180'
								: ''}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if selectedMatch}
						<a
							href={resolve('/reports/[matchId]', { matchId: selectedMatch.id })}
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
							{#each filteredMatchGroups as group (group.label)}
								{#if group.matches.length > 0}
									<p
										class="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase"
									>
										{group.label}
									</p>
									{#each group.matches as m (m.id)}
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
				{#each sortedOurMatches as m (m.id)}
					<a
						href={`${resolve('/matches')}?match=${encodeURIComponent(m.id)}`}
						rel="external"
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
	{/if}

	{#if selectedMatch && data.matchTeams}
		<!-- Prediction Center -->
		{#if data.prediction}
			{@const p = data.prediction}
			<div
				class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800/80 dark:bg-slate-900"
			>
				<div
					class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800"
				>
					<div>
						<h2 class="text-xs font-bold tracking-wider text-slate-400 uppercase">
							Match Forecast & Prediction
						</h2>
						<p class="font-mono text-base font-black text-slate-900 sm:text-lg dark:text-white">
							{matchFullLabel(selectedMatch)}
						</p>
					</div>
					{#if p.actualRedScore != null && p.actualBlueScore != null}
						<span
							class="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
						>
							Final Result
						</span>
					{:else}
						<span
							class="rounded-full bg-cyan-50 px-3 py-1 font-mono text-xs font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
						>
							Pre-Match Forecast
						</span>
					{/if}
				</div>

				<!-- Side by Side Score Forecast -->
				<div class="grid grid-cols-2 gap-4 text-center">
					<!-- Red Alliance Score -->
					<div
						class="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 sm:p-5 dark:border-rose-900/40 dark:bg-rose-950/20"
					>
						<p class="text-xs font-bold tracking-wider text-rose-600 uppercase dark:text-rose-400">
							Red Alliance
						</p>
						<div class="mt-2 flex items-baseline justify-center gap-2">
							<span
								class="font-mono text-xl font-bold tracking-tight text-rose-600 sm:text-2xl dark:text-rose-400"
							>
								{p.predictedRedScore.toFixed(0)}
							</span>
							<span class="text-[11px] font-semibold text-rose-400">pred</span>
						</div>
						{#if p.actualRedScore != null}
							<div
								class="mt-1 flex items-baseline justify-center gap-1.5 border-t border-rose-200/60 pt-1.5 dark:border-rose-900/60"
							>
								<span
									class="font-mono text-lg font-black text-rose-700 sm:text-xl dark:text-rose-300"
								>
									{p.actualRedScore}
								</span>
								<span class="text-[10px] font-bold text-rose-500 uppercase">final</span>
							</div>
						{/if}
					</div>

					<!-- Blue Alliance Score -->
					<div
						class="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5 dark:border-blue-900/40 dark:bg-blue-950/20"
					>
						<p class="text-xs font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
							Blue Alliance
						</p>
						<div class="mt-2 flex items-baseline justify-center gap-2">
							<span
								class="font-mono text-xl font-bold tracking-tight text-blue-600 sm:text-2xl dark:text-blue-400"
							>
								{p.predictedBlueScore.toFixed(0)}
							</span>
							<span class="text-[11px] font-semibold text-blue-400">pred</span>
						</div>
						{#if p.actualBlueScore != null}
							<div
								class="mt-1 flex items-baseline justify-center gap-1.5 border-t border-blue-200/60 pt-1.5 dark:border-blue-900/60"
							>
								<span
									class="font-mono text-lg font-black text-blue-700 sm:text-xl dark:text-blue-300"
								>
									{p.actualBlueScore}
								</span>
								<span class="text-[10px] font-bold text-blue-500 uppercase">final</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Win Probability Bar -->
				<div class="mt-5 space-y-1.5">
					<div class="flex items-center justify-between text-xs font-bold">
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
						class="relative h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
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
					{#each data.matchTeams.red as team (team.number)}
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
					{#each data.matchTeams.blue as team (team.number)}
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
					href={resolve('/teams/[teamnum]', { teamnum: String(team.number) })}
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

		<!-- Telemetry Stats Grid -->
		<div class="grid grid-cols-3 gap-2 p-3 text-center text-xs sm:grid-cols-6">
			<!-- Rank -->
			<div class="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/40">
				<p class="text-[10px] font-bold text-slate-400 uppercase">Rank</p>
				<p class="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-300">
					{team.rank != null ? `#${team.rank}` : '—'}
				</p>
			</div>

			<!-- Auto Scored -->
			<div class="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/40">
				<p class="text-[10px] font-bold text-slate-400 uppercase">Auto</p>
				<p class="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-300">
					{fmt1(team.avgAutoFuel)}
				</p>
			</div>

			<!-- Teleop Fuel -->
			<div class="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/40">
				<p class="text-[10px] font-bold text-slate-400 uppercase">Tele Fuel</p>
				<p class="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-300">
					{team.avgTeleFuel != null ? `${fmt1(team.avgTeleFuel)}/5` : '—'}
				</p>
			</div>

			<!-- Passing -->
			<div class="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/40">
				<p class="text-[10px] font-bold text-slate-400 uppercase">Pass</p>
				<p class="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-300">
					{team.avgPassScore != null ? `${fmt1(team.avgPassScore)}/5` : '—'}
				</p>
			</div>

			<!-- Defense -->
			<div class="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/40">
				<p class="text-[10px] font-bold text-slate-400 uppercase">Def</p>
				<p class="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-300">
					{team.avgDefScore != null ? `${fmt1(team.avgDefScore)}/5` : '—'}
				</p>
			</div>

			<!-- Climb % -->
			<div class="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/40">
				<p class="text-[10px] font-bold text-slate-400 uppercase">Climb</p>
				<p class="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-300">
					{team.climbRate != null ? `${team.climbRate.toFixed(0)}%` : '—'}
				</p>
			</div>
		</div>

		<!-- Pit Hardware Strip -->
		{#if team.pitData}
			<div
				class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 bg-slate-50/40 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/20 dark:text-slate-400"
			>
				<span class="font-semibold text-slate-700 dark:text-slate-300"
					>Drive: <span class="font-normal">{team.pitData.drivetrain || '—'}</span></span
				>
				<span class="text-slate-300 dark:text-slate-700">•</span>
				<span class="font-semibold text-slate-700 dark:text-slate-300"
					>Shooter: <span class="font-normal">{team.pitData.shooterType || '—'}</span></span
				>
				<span class="text-slate-300 dark:text-slate-700">•</span>
				<span class="font-semibold text-slate-700 dark:text-slate-300"
					>Intake: <span class="font-normal">{team.pitData.intakeType || '—'}</span></span
				>
			</div>
		{/if}
	</div>
{/snippet}
