<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';

	let { data, form } = $props();

	let wipeModalOpen = $state(false);
	let cleanupModalOpen = $state(false);

	let selectedMatchType = $state(untrack(() => data.defaultMatchType ?? 'qualification'));
	let autoTbaPull = $state(untrack(() => data.autoTbaPull ?? false));

	$effect(() => {
		selectedMatchType = data.defaultMatchType ?? 'qualification';
	});

	const tbaMatchesSkipped = $derived(
		(form as Record<string, unknown> | null)?.matchesSkipped === true
	);
</script>

<div class="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
	<!-- Page Header -->
	<div
		class="flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end dark:border-slate-800/80"
	>
		<div>
			<div class="flex items-center gap-2.5">
				<h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
					Admin Dashboard
				</h1>
				<span
					class="rounded-full bg-rose-50 px-2.5 py-0.5 font-mono text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300"
				>
					Admin Mode
				</span>
			</div>
			<p class="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
				Manage event synchronization, match types, data integrity, and database operations.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/admin/reports"
				class="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
			>
				Report Fixer ↗
			</a>
			<form method="POST" action="?/logout" use:enhance>
				<button
					type="submit"
					class="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 shadow-2xs transition-colors hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
				>
					Log out
				</button>
			</form>
		</div>
	</div>

	<!-- Alerts -->
	{#if form?.success && form?.action === 'cleanup'}
		<div
			class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/30"
		>
			<p class="font-bold text-emerald-800 dark:text-emerald-300">Database Cleanup Successful</p>
			<p class="mt-1 text-emerald-700 dark:text-emerald-400">
				Removed {form.deletedMatches?.length ?? 0} unused matches and {form.deletedTeams?.length ??
					0} unused teams.
			</p>
		</div>
	{/if}

	{#if form?.action === 'setMatchType'}
		{#if form.success}
			<div
				class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
			>
				Match type set to <b>{form.matchType}</b>.
			</div>
		{:else}
			<div
				class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
			>
				{form?.message ?? 'Failed to set match type.'}
			</div>
		{/if}
	{/if}

	{#if form?.action === 'fetchTBA'}
		{#if form.success}
			<div
				class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/30"
			>
				<p class="font-bold text-emerald-800 dark:text-emerald-300">TBA Import Successful</p>
				<p class="mt-1 text-emerald-700 dark:text-emerald-400">
					{#if tbaMatchesSkipped}
						Imported <b>{form.teamsInserted}</b> teams. Match schedule skipped in practice mode.
					{:else}
						Imported <b>{form.teamsInserted}</b> teams and <b>{form.matchesInserted}</b> matches.
					{/if}
				</p>
			</div>
		{:else}
			<div
				class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs dark:border-rose-900/50 dark:bg-rose-950/30"
			>
				<p class="font-bold text-rose-800 dark:text-rose-300">TBA Import Failed or Incomplete</p>
				<div class="mt-1 text-rose-700 dark:text-rose-400">
					{#if form.errors?.length}
						<ul class="list-disc pl-4">
							{#each form.errors as err}
								<li>{err}</li>
							{/each}
						</ul>
					{:else}
						<p>{form.message ?? 'Unknown error occurred during import.'}</p>
					{/if}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Main Settings Grid -->
	<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
		<!-- Match Type Selector -->
		<div
			class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div class="mb-3">
				<h2 class="text-sm font-bold text-slate-900 dark:text-white">Active Match Type</h2>
				<p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
					Choose whether new scouting scans are recorded as qualification or practice matches.
				</p>
			</div>

			<form method="POST" action="?/setMatchType" use:enhance class="space-y-4 pt-1">
				<div class="grid grid-cols-2 gap-2.5">
					<label
						class="flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-bold transition-colors
						{selectedMatchType === 'qualification'
							? 'border-cyan-500 bg-cyan-50/60 text-cyan-800 dark:border-cyan-500 dark:bg-cyan-950/40 dark:text-cyan-300'
							: 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/50 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300'}"
					>
						<input
							type="radio"
							name="matchType"
							value="qualification"
							bind:group={selectedMatchType}
							class="text-cyan-600 focus:ring-cyan-500"
						/>
						Qualification
					</label>

					<label
						class="flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-bold transition-colors
						{selectedMatchType === 'practice'
							? 'border-cyan-500 bg-cyan-50/60 text-cyan-800 dark:border-cyan-500 dark:bg-cyan-950/40 dark:text-cyan-300'
							: 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/50 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300'}"
					>
						<input
							type="radio"
							name="matchType"
							value="practice"
							bind:group={selectedMatchType}
							class="text-cyan-600 focus:ring-cyan-500"
						/>
						Practice
					</label>
				</div>

				<button
					type="submit"
					class="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-cyan-700"
				>
					Save Match Type
				</button>
			</form>
		</div>

		<!-- TBA & Statbotics Sync -->
		<div
			class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div class="mb-3">
				<h2 class="text-sm font-bold text-slate-900 dark:text-white">
					Event Synchronization (TBA & Statbotics)
				</h2>
				<p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
					Pull team lists, EPA ratings, OPRs, and match schedules from The Blue Alliance.
				</p>
			</div>

			<form method="POST" action="?/fetchTBA" use:enhance class="space-y-3 pt-1">
				<div>
					<label for="eventKey" class="block text-xs font-bold text-slate-700 dark:text-slate-300">
						TBA Event Code
					</label>
					<input
						id="eventKey"
						name="eventKey"
						placeholder="e.g. 2026okok"
						value={data.eventCode}
						required
						class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					/>
				</div>

				{#if !data.tbaApiKeyConfigured}
					<div>
						<label
							for="tbaApiKey"
							class="block text-xs font-bold text-slate-700 dark:text-slate-300"
						>
							TBA API Key
						</label>
						<input
							id="tbaApiKey"
							name="tbaApiKey"
							type="password"
							placeholder="Your TBA Read API key"
							class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
						/>
					</div>
				{/if}

				<button
					type="submit"
					class="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-cyan-700"
				>
					{selectedMatchType === 'practice' ? 'Download Teams' : 'Sync Event & Schedule'}
				</button>
			</form>

			<div class="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
				<form
					method="POST"
					action="?/setAutoTbaPull"
					use:enhance={() => {
						autoTbaPull = !autoTbaPull;
					}}
				>
					<input type="hidden" name="autoTbaPull" value={autoTbaPull ? 'false' : 'true'} />
					<label class="flex cursor-pointer items-center justify-between">
						<span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
							Background Auto-Sync (Every 15 mins)
						</span>
						<button
							type="submit"
							aria-label="Toggle background auto-sync"
							class="relative h-6 w-11 rounded-full transition-colors {autoTbaPull
								? 'bg-cyan-600'
								: 'bg-slate-200 dark:bg-slate-700'}"
						>
							<span
								class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform {autoTbaPull
									? 'translate-x-5'
									: 'translate-x-0'}"
							></span>
						</button>
					</label>
				</form>
			</div>
		</div>

		<!-- Database Cleanup -->
		<div
			class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
		>
			<h2 class="text-sm font-bold text-slate-900 dark:text-white">Database Cleanup</h2>
			<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
				Safely remove orphaned matches or teams that do not have any attached scouting or pit
				reports.
			</p>
			<div class="mt-4">
				<button
					type="button"
					onclick={() => (cleanupModalOpen = true)}
					class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 shadow-2xs transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
				>
					Clean Up Unused Records
				</button>
			</div>
		</div>

		<!-- Danger Zone -->
		<div
			class="overflow-hidden rounded-2xl border border-rose-200/80 bg-rose-50/40 p-5 dark:border-rose-900/50 dark:bg-rose-950/20"
		>
			<h2 class="text-sm font-bold text-rose-700 dark:text-rose-300">Danger Zone</h2>
			<p class="mt-1 text-xs text-rose-600 dark:text-rose-400">
				Wiping the database will permanently delete all matches, teams, and scouting reports.
			</p>
			<div class="mt-4">
				<button
					type="button"
					onclick={() => (wipeModalOpen = true)}
					class="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-rose-700"
				>
					Wipe Database
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Cleanup Confirmation Modal -->
{#if cleanupModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
	>
		<div
			class="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
		>
			<h2 class="text-base font-bold text-slate-900 dark:text-white">Clean Up Unused Data?</h2>
			<p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
				This will remove matches and teams with zero scouting reports. Scouted reports and active
				teams will be kept.
			</p>
			<div class="mt-5 flex justify-end gap-2.5">
				<button
					onclick={() => (cleanupModalOpen = false)}
					class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
				>
					Cancel
				</button>
				<form method="POST" action="?/cleanupDatabase" use:enhance>
					<button
						type="submit"
						class="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-amber-700"
					>
						Yes, Clean Up
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Wipe Confirmation Modal -->
{#if wipeModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
	>
		<div
			class="w-full max-w-sm rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900 dark:bg-slate-900"
		>
			<h2 class="text-base font-bold text-rose-700 dark:text-rose-400">Wipe Entire Database?</h2>
			<p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
				Are you sure you want to permanently erase ALL teams, matches, pit scouting data, and
				observations? This cannot be undone.
			</p>
			<div class="mt-5 flex justify-end gap-2.5">
				<button
					onclick={() => (wipeModalOpen = false)}
					class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
				>
					Cancel
				</button>
				<form method="POST" action="?/wipeDatabase" use:enhance>
					<button
						type="submit"
						class="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-rose-700"
					>
						Yes, Delete Everything
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
