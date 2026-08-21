<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data, form } = $props();

	let editingId = $state<number | null>(null);
	let editingValue = $state('');
	let searchFilter = $state('');

	function startEdit(id: number, current: number) {
		editingId = id;
		editingValue = String(current);
	}
	function cancelEdit() {
		editingId = null;
		editingValue = '';
	}

	const sortedReports = $derived.by(() => {
		const list = [...data.reports].sort((a, b) =>
			a.isGhost === b.isGhost ? 0 : a.isGhost ? -1 : 1
		);
		const q = searchFilter.trim().toLowerCase();
		if (!q) return list;
		return list.filter(
			(r) =>
				String(r.teamNumber).includes(q) ||
				r.matchId.toLowerCase().includes(q) ||
				(r.teamName ?? '').toLowerCase().includes(q) ||
				r.scouterName.toLowerCase().includes(q)
		);
	});
</script>

<div class="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:py-8">
	<!-- Page Header & Breadcrumb -->
	<div class="border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
		<div class="mb-2">
			<a
				href={resolve('/admin')}
				class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
			>
				<svg
					class="h-3.5 w-3.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Back to Admin Dashboard
			</a>
		</div>

		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
			<div>
				<h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
					Report & Ghost Team Fixer
				</h1>
				<p class="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
					Correct scouter typos, reassign report team numbers, and clean up ghost teams.
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
					placeholder="Search match or team…"
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
	</div>

	<!-- Alerts -->
	{#if form?.success && form.action === 'fixReport'}
		<div
			class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
		>
			Team number updated successfully.
		</div>
	{/if}
	{#if form?.success && form.action === 'deleteReport'}
		<div
			class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
		>
			Scouting report deleted.
		</div>
	{/if}
	{#if form?.success && form.action === 'deleteGhostTeam'}
		<div
			class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
		>
			Ghost team {form.teamNum} deleted.
		</div>
	{/if}
	{#if form?.error}
		<div
			class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
		>
			{form.error}
		</div>
	{/if}

	<!-- Ghost Teams Section -->
	<div class="space-y-3">
		<div class="flex items-center gap-2.5">
			<h2 class="text-sm font-bold text-slate-900 dark:text-white">Ghost Teams</h2>
			<span
				class="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
			>
				{data.ghostTeams.length}
			</span>
		</div>
		<p class="text-xs text-slate-500 dark:text-slate-400">
			Teams automatically created from unrecognized scans without TBA metadata. Delete them once
			their reports are reassigned.
		</p>

		{#if data.ghostTeams.length === 0}
			<div
				class="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900"
			>
				No ghost teams detected in the database.
			</div>
		{:else}
			<div
				class="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:divide-slate-800 dark:border-slate-800/80 dark:bg-slate-900"
			>
				{#each data.ghostTeams as team (team.number)}
					<div class="flex items-center justify-between p-3.5">
						<div class="flex items-center gap-2.5">
							<span class="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
								{team.number}
							</span>
							<span class="text-xs text-slate-500 dark:text-slate-400">{team.name}</span>
							{#if team.reportCount > 0}
								<span
									class="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300"
								>
									{team.reportCount} report{team.reportCount !== 1 ? 's' : ''} attached — fix first
								</span>
							{:else}
								<span
									class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
								>
									Ready to delete
								</span>
							{/if}
						</div>

						<form method="POST" action="?/deleteGhostTeam" use:enhance>
							<input type="hidden" name="number" value={team.number} />
							<button
								type="submit"
								disabled={team.reportCount > 0}
								class="rounded-xl px-3 py-1.5 text-xs font-bold transition-colors
									{team.reportCount > 0
									? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
									: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300'}"
							>
								Delete Ghost Team
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Reports Table -->
	<div class="space-y-3 pt-3">
		<div class="flex items-center gap-2.5">
			<h2 class="text-sm font-bold text-slate-900 dark:text-white">Scouting Reports</h2>
			<span
				class="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
			>
				{sortedReports.length} Reports
			</span>
		</div>

		{#if sortedReports.length === 0}
			<div
				class="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900"
			>
				No scouting reports match your query.
			</div>
		{:else}
			<div
				class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
			>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs">
						<thead>
							<tr
								class="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/50"
							>
								<th class="px-4 py-2.5">Match</th>
								<th class="px-4 py-2.5">Team</th>
								<th class="px-4 py-2.5">Scouter</th>
								<th class="px-4 py-2.5">Reassign Team #</th>
								<th class="px-4 py-2.5 text-right">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
							{#each sortedReports as report (report.id)}
								<tr
									class="transition-colors hover:bg-cyan-50/30 dark:hover:bg-cyan-950/20 {report.isGhost
										? 'bg-amber-50/40 dark:bg-amber-950/20'
										: ''}"
								>
									<td class="px-4 py-2.5">
										<a
											href={resolve('/reports/[matchId]', { matchId: report.matchId })}
											class="font-mono font-bold text-cyan-600 hover:underline dark:text-cyan-400"
										>
											{report.matchId}
										</a>
									</td>

									<td class="px-4 py-2.5">
										<div class="flex items-center gap-1.5">
											<span
												class="font-mono font-black {report.isGhost
													? 'text-amber-600 dark:text-amber-400'
													: 'text-slate-900 dark:text-slate-100'}"
											>
												{report.teamNumber}
											</span>
											{#if report.isGhost}
												<span
													class="py-0.2 rounded bg-amber-100 px-1 font-mono text-[9px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
												>
													ghost
												</span>
											{/if}
										</div>
										<p class="text-[10px] text-slate-400">{report.teamName ?? '—'}</p>
									</td>

									<td class="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">
										{report.scouterName}
									</td>

									<td class="px-4 py-2.5">
										{#if editingId === report.id}
											<form
												method="POST"
												action="?/fixReport"
												use:enhance={() => {
													return ({ update }) => {
														cancelEdit();
														update();
													};
												}}
												class="flex items-center gap-1.5"
											>
												<input type="hidden" name="id" value={report.id} />
												<input
													type="number"
													name="newTeam"
													bind:value={editingValue}
													min="1"
													max="99999"
													class="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
												/>
												<button
													type="submit"
													class="rounded-lg bg-cyan-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-cyan-700"
												>
													Save
												</button>
												<button
													type="button"
													onclick={cancelEdit}
													class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
												>
													✕
												</button>
											</form>
										{:else}
											<button
												onclick={() => startEdit(report.id, report.teamNumber)}
												class="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600 transition-colors hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-cyan-950/40"
											>
												Edit Team #
											</button>
										{/if}
									</td>

									<td class="px-4 py-2.5 text-right">
										<form method="POST" action="?/deleteReport" use:enhance>
											<input type="hidden" name="id" value={report.id} />
											<button
												type="submit"
												class="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
											>
												Delete
											</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>
