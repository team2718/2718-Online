<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	let selectedMatchId = $state(data.matchId ?? '');

	function onMatchChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		selectedMatchId = val;
		if (val) goto(`/prematch?match=${encodeURIComponent(val)}`);
		else goto('/prematch');
	}

	const fmt1 = (v: number | null) => (v == null ? '—' : v.toFixed(1));
	const fmtPct = (v: number) => `${v}%`;

	// Group matches by type for the optgroups
	const matchGroups = $derived.by(() => {
		const groups: Record<string, typeof data.allMatches> = {};
		for (const m of data.allMatches) {
			const type = m.matchType ?? 'unknown';
			if (!groups[type]) groups[type] = [];
			groups[type].push(m);
		}
		return groups;
	});

	const groupOrder = ['practice', 'qualification', 'playoff', 'unknown'];
	const groupLabel: Record<string, string> = {
		practice: 'Practice',
		qualification: 'Qualification',
		playoff: 'Playoff',
		unknown: 'Other'
	};
</script>

<div class="mx-auto max-w-7xl px-4 py-6">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-black tracking-tight text-gray-900">Pre-Match Analysis</h1>
		<p class="mt-1 text-sm text-gray-500">Select a match to view scouting data for all six robots.</p>
	</div>

	<!-- Match selector -->
	<div class="mb-8">
		<label for="match-select" class="mb-1.5 block text-sm font-semibold text-gray-700">Match</label>
		<select
			id="match-select"
			value={selectedMatchId}
			onchange={onMatchChange}
			class="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-64"
		>
			<option value="">— Select a match —</option>
			{#each groupOrder as type}
				{#if matchGroups[type]?.length > 0}
					<optgroup label={groupLabel[type]}>
						{#each matchGroups[type] as m}
							<option value={m.id}>{m.id}</option>
						{/each}
					</optgroup>
				{/if}
			{/each}
		</select>
	</div>

	{#if data.error}
		<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
			{data.error}
		</div>
	{:else if data.matchTeams}
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
			<div>
				<a href="/teams/{team.number}" class="text-lg font-black {accentText} hover:underline">
					{team.number}
				</a>
				<span class="ml-2 text-sm font-semibold text-gray-600 truncate">{team.name}</span>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				{#if team.opr != null}
					<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
						OPR {team.opr.toFixed(1)}
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
					<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Auto Fuel</p>
					<p class="text-xl font-black text-gray-900">{fmt1(team.avgAutoFuel)}</p>
				</div>
				<div class="px-3 py-2.5 text-center">
					<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Tele Rate</p>
					<p class="text-xl font-black text-gray-900">
						{fmt1(team.avgTeleFuelRate)}<span class="text-xs font-normal text-gray-400">/5</span>
					</p>
				</div>
				<div class="px-3 py-2.5 text-center">
					<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">Climb L1+</p>
					<p class="text-xl font-black text-gray-900">{fmtPct(team.climbAtLeastL1Pct)}</p>
				</div>
			</div>

			<div class="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
				<div class="px-3 py-2.5">
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
				<div class="px-3 py-2.5">
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
						<span class="text-gray-400">Max Climb:</span>
						<span class="ml-1 font-semibold text-gray-700">{team.pit.data?.climb ?? '—'}</span>
					</div>
				</div>
				{#if team.pit.data?.knownIssues}
					<p class="mt-2 text-xs text-red-600 italic">⚠ {team.pit.data.knownIssues}</p>
				{/if}
			</div>
		{/if}

		{#if team.reportCount === 0 && !team.pit}
			<div class="px-4 py-4 text-center text-xs text-gray-400 italic">
				No scouting or pit data available for this team yet.
			</div>
		{/if}
	</div>
{/snippet}
