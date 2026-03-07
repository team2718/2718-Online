<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Track which report row is in edit mode
	let editingId = $state<number | null>(null);
	let editingValue = $state('');

	function startEdit(id: number, current: number) {
		editingId = id;
		editingValue = String(current);
	}
	function cancelEdit() {
		editingId = null;
		editingValue = '';
	}

	// Ghost reports float to the top; order within each group preserved from server
	const sortedReports = $derived(
		[...data.reports].sort((a, b) => (a.isGhost === b.isGhost ? 0 : a.isGhost ? -1 : 1))
	);
</script>

<div class="mx-auto max-w-5xl px-4 py-8">
	<div class="mb-6 flex items-center gap-3">
		<a href="/admin" class="text-sm text-blue-600 hover:underline">← Admin</a>
		<h1 class="text-2xl font-black text-gray-900">Report Fixer</h1>
	</div>

	<!-- Alerts -->
	{#if form?.success && form.action === 'fixReport'}
		<div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
			Team number updated successfully.
		</div>
	{/if}
	{#if form?.success && form.action === 'deleteReport'}
		<div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
			Report deleted.
		</div>
	{/if}
	{#if form?.success && form.action === 'deleteGhostTeam'}
		<div class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
			Ghost team {form.teamNum} deleted.
		</div>
	{/if}
	{#if form?.error}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
			{form.error}
		</div>
	{/if}

	<!-- Ghost Teams -->
	<div class="mb-8">
		<div class="mb-3 flex items-center gap-3">
			<h2 class="text-lg font-bold text-gray-800">Ghost Teams</h2>
			<span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">{data.ghostTeams.length}</span>
		</div>
		<p class="mb-4 text-sm text-gray-500">
			Teams created automatically by wrong scans — no TBA metadata. Safe to delete once their reports are fixed or removed.
		</p>

		{#if data.ghostTeams.length === 0}
			<div class="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
				No ghost teams.
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				{#each data.ghostTeams as team, i}
					<div class="flex items-center justify-between gap-3 px-4 py-3 {i > 0 ? 'border-t border-gray-100' : ''}">
						<div>
							<span class="font-bold text-orange-600">{team.number}</span>
							<span class="ml-2 text-sm text-gray-500">{team.name}</span>
							{#if team.reportCount > 0}
								<span class="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
									{team.reportCount} report{team.reportCount !== 1 ? 's' : ''} — fix first
								</span>
							{:else}
								<span class="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-600">ready to delete</span>
							{/if}
						</div>

						<form method="POST" action="?/deleteGhostTeam" use:enhance>
							<input type="hidden" name="number" value={team.number} />
							<button
								type="submit"
								disabled={team.reportCount > 0}
								class="rounded px-3 py-1.5 text-xs font-semibold
									{team.reportCount > 0
										? 'cursor-not-allowed bg-gray-100 text-gray-400'
										: 'bg-red-50 text-red-600 hover:bg-red-100'}"
							>
								Delete
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Reports -->
	<div class="mb-8">
		<div class="mb-3 flex items-center gap-3">
			<h2 class="text-lg font-bold text-gray-800">Scouting Reports</h2>
			<span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">{data.reports.length}</span>
			{#if data.reports.filter(r => r.isGhost).length > 0}
				<span class="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
					{data.reports.filter(r => r.isGhost).length} with ghost team
				</span>
			{/if}
		</div>

		{#if data.reports.length === 0}
			<div class="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
				No scouting reports yet.
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
				<!-- Header -->
				<div class="grid grid-cols-[5rem_6rem_1fr_1fr_auto] gap-x-3 border-b border-gray-200 bg-gray-50 px-3 py-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
					<span>Match</span>
					<span>Team</span>
					<span>Scout</span>
					<span>Change Team #</span>
					<span></span>
				</div>

				{#each sortedReports as report, i}
					<div class="grid grid-cols-[5rem_6rem_1fr_1fr_auto] items-center gap-x-3 px-3 py-2 text-sm
						{i > 0 ? 'border-t border-gray-100' : ''}
						{report.isGhost ? 'bg-orange-50' : ''}">

						<!-- Match -->
						<a href="/matches/{report.matchId}" class="font-mono text-xs font-bold text-blue-600 hover:underline">
							{report.matchId}
						</a>

						<!-- Team -->
						<div>
							<span class="font-bold {report.isGhost ? 'text-orange-600' : 'text-gray-800'}">
								{report.teamNumber}
							</span>
							{#if report.isGhost}
								<span class="ml-1 rounded bg-orange-100 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange-500">ghost</span>
							{/if}
							<p class="text-[10px] text-gray-400">{report.teamName ?? '—'}</p>
						</div>

						<!-- Scouter -->
						<span class="truncate text-xs text-gray-600">{report.scouterName}</span>

						<!-- Change team inline form -->
						{#if editingId === report.id}
							<form method="POST" action="?/fixReport" use:enhance={() => {
								return ({ update }) => { cancelEdit(); update(); };
							}} class="flex items-center gap-1">
								<input type="hidden" name="id" value={report.id} />
								<input
									type="number"
									name="newTeam"
									bind:value={editingValue}
									min="1"
									max="99999"
									class="w-20 rounded border border-gray-300 px-1.5 py-1 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
								/>
								<button type="submit" class="rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700">Save</button>
								<button type="button" onclick={cancelEdit} class="rounded bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-200">✕</button>
							</form>
						{:else}
							<button
								onclick={() => startEdit(report.id, report.teamNumber)}
								class="justify-self-start rounded border border-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
							>
								Edit #
							</button>
						{/if}

						<!-- Delete -->
						<form method="POST" action="?/deleteReport" use:enhance>
							<input type="hidden" name="id" value={report.id} />
							<button type="submit" class="rounded bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-100">
								Delete
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
