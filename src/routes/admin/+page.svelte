<script lang="ts">
	import { Button, Modal, Alert, Label, Input, Radio } from 'flowbite-svelte';
	import {
		ExclamationCircleOutline,
		InfoCircleSolid,
		CheckCircleSolid,
		CloseCircleSolid
	} from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let wipeModalOpen = $state(false);
	let cleanupModalOpen = $state(false);

	// Local state for the match type selector (initialised from server load data)
	let selectedMatchType = $state(data.defaultMatchType ?? 'qualification');
	let autoTbaPull = $state(data.autoTbaPull ?? false);
	$effect(() => { selectedMatchType = data.defaultMatchType ?? 'qualification'; });

	const tbaMatchesSkipped = $derived((form as Record<string, unknown> | null)?.matchesSkipped === true);
</script>

<div class="mx-auto max-w-7xl px-4 py-10">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Admin Dashboard</h1>
		<form method="POST" action="?/logout" use:enhance>
			<Button color="alternative" type="submit">Log out</Button>
		</form>
	</div>

	<!-- ── Alerts ────────────────────────────────────────────────────── -->

	{#if form?.success && form?.action === 'cleanup'}
		<Alert color="green" class="mb-6 border border-green-200">
			<div class="flex items-center gap-2 text-lg font-bold text-green-800">
				<InfoCircleSolid class="h-6 w-6" />
				Database Cleanup Successful
			</div>
			<div class="mt-4 space-y-2 text-sm text-green-700">
				<p>
					<strong class="font-bold">Deleted Matches ({form.deletedMatches?.length || 0}):</strong>
					{form.deletedMatches?.length ? form.deletedMatches.join(', ') : 'None'}
				</p>
				<p>
					<strong class="font-bold">Deleted Teams ({form.deletedTeams?.length || 0}):</strong>
					{form.deletedTeams?.length ? form.deletedTeams.join(', ') : 'None'}
				</p>
			</div>
		</Alert>
	{/if}

	{#if form?.action === 'setMatchType'}
		{#if form.success}
			<Alert color="green" class="mb-6 border border-green-200">
				<div class="flex items-center gap-2 font-semibold text-green-800">
					<CheckCircleSolid class="h-5 w-5" />
					Match type set to <strong>{form.matchType}</strong>.
				</div>
			</Alert>
		{:else}
			<Alert color="red" class="mb-6 border border-red-200">
				<div class="flex items-center gap-2 font-semibold text-red-800">
					<CloseCircleSolid class="h-5 w-5" />
					{form?.message ?? 'Failed to set match type.'}
				</div>
			</Alert>
		{/if}
	{/if}

	{#if form?.action === 'fetchTBA'}
		{#if form.success}
			<Alert color="green" class="mb-6 border border-green-200">
				<div class="flex items-center gap-2 text-lg font-bold text-green-800">
					<CheckCircleSolid class="h-6 w-6" />
					TBA Import Successful
				</div>
				<div class="mt-2 text-sm text-green-700">
					{#if tbaMatchesSkipped}
						Imported <strong>{form.teamsInserted}</strong> teams. Match import skipped — practice matches are created automatically when scans are submitted.
					{:else}
						Imported <strong>{form.teamsInserted}</strong> teams and
						<strong>{form.matchesInserted}</strong> matches.
					{/if}
				</div>
			</Alert>
		{:else}
			<Alert color="red" class="mb-6 border border-red-200">
				<div class="flex items-center gap-2 text-lg font-bold text-red-800">
					<CloseCircleSolid class="h-6 w-6" />
					TBA Import Completed with Errors
				</div>
				<div class="mt-2 text-sm text-red-700">
					{#if (form.teamsInserted ?? 0) > 0 || (form.matchesInserted ?? 0) > 0}
						<p>Partial import: <strong>{form.teamsInserted}</strong> teams, <strong>{form.matchesInserted}</strong> matches.</p>
					{/if}
					{#if form.errors?.length}
						<ul class="mt-1 list-disc pl-4">
							{#each form.errors as err}
								<li>{err}</li>
							{/each}
						</ul>
					{:else}
						<p>{form.message ?? 'Unknown error.'}</p>
					{/if}
				</div>
			</Alert>
		{/if}
	{/if}

	{#if form?.action === 'setAutoTbaPull'}
		{#if form.success}
			<Alert color="green" class="mb-6 border border-green-200">
				<div class="flex items-center gap-2 font-semibold text-green-800">
					<CheckCircleSolid class="h-5 w-5" />
					Auto-pull {form.autoTbaPull ? 'enabled' : 'disabled'}.
				</div>
			</Alert>
		{:else}
			<Alert color="red" class="mb-6 border border-red-200">
				<div class="flex items-center gap-2 font-semibold text-red-800">
					<CloseCircleSolid class="h-5 w-5" />
					{form?.message ?? 'Failed to update auto-pull setting.'}
				</div>
			</Alert>
		{/if}
	{/if}

	<!-- ── Main Grid ─────────────────────────────────────────────────── -->

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">

		<!-- Today's Match Type -->
		<div class="rounded-xl border border-blue-200 bg-blue-50 p-6">
			<h2 class="text-lg font-bold text-blue-700">Today's Match Type</h2>
			<p class="mb-4 text-sm text-blue-600">
				Select whether today's scouting session covers practice or qualification matches.
				Scanned QR codes will be filed under the selected type.
			</p>
			<form method="POST" action="?/setMatchType" use:enhance class="space-y-3">
				<div class="flex gap-6">
					<Label class="flex cursor-pointer items-center gap-2 font-medium text-blue-800">
						<Radio name="matchType" value="qualification" bind:group={selectedMatchType} />
						Qualification
					</Label>
					<Label class="flex cursor-pointer items-center gap-2 font-medium text-blue-800">
						<Radio name="matchType" value="practice" bind:group={selectedMatchType} />
						Practice
					</Label>
				</div>
				<Button color="blue" type="submit">Save</Button>
			</form>
		</div>

		<!-- The Blue Alliance Import -->
		<div class="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
			<h2 class="text-lg font-bold text-indigo-700">Import from The Blue Alliance</h2>
			<p class="mb-4 text-sm text-indigo-600">
				{#if selectedMatchType === 'practice'}
					Download the team list for this event. Match import is skipped in practice mode — TBA does not track practice matches. Matches will be created automatically as scans are submitted.
				{:else}
					Download the match schedule and team list for an event. Existing records will be updated.
				{/if}
				{#if data.tbaApiKeyConfigured}
					<span class="font-medium">(TBA_API_KEY is configured in the environment.)</span>
				{/if}
			</p>
			{#if data.eventCode}
				<p class="mb-3 text-sm text-indigo-700">
					Stored event code: <code class="rounded bg-indigo-100 px-1 font-mono">{data.eventCode}</code>
				</p>
			{/if}
			<form method="POST" action="?/fetchTBA" use:enhance class="space-y-3">
				<div>
					<Label for="eventKey" class="mb-1 block text-sm font-medium text-indigo-800">
						Event Key
					</Label>
					<Input
						id="eventKey"
						name="eventKey"
						placeholder="e.g. 2026okok"
						value={data.eventCode}
						required
						class="bg-white"
					/>
					<p class="mt-1 text-xs text-indigo-500">
						Find event keys on thebluealliance.com — e.g. <code>2026okok</code> for the 2026 Oklahoma Regional.
					</p>
				</div>
				{#if !data.tbaApiKeyConfigured}
					<div>
						<Label for="tbaApiKey" class="mb-1 block text-sm font-medium text-indigo-800">
							TBA API Key
						</Label>
						<Input
							id="tbaApiKey"
							name="tbaApiKey"
							type="password"
							placeholder="Your Read API key from thebluealliance.com/account"
							class="bg-white"
						/>
					</div>
				{/if}
				<Button color="purple" type="submit">
					{selectedMatchType === 'practice' ? 'Download Teams' : 'Download Schedule & Teams'}
				</Button>
			</form>
			<div class="mt-4 border-t border-indigo-200 pt-4">
				<form method="POST" action="?/setAutoTbaPull" use:enhance={() => { autoTbaPull = !autoTbaPull; }}>
					<input type="hidden" name="autoTbaPull" value={autoTbaPull ? 'false' : 'true'} />
					<label class="flex cursor-pointer items-center gap-3">
						<div
							class="relative h-6 w-11 rounded-full transition-colors {autoTbaPull ? 'bg-indigo-600' : 'bg-gray-300'}"
						>
							<div
								class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform {autoTbaPull ? 'translate-x-5' : 'translate-x-0.5'}"
							></div>
						</div>
						<button
							type="submit"
							class="text-sm font-medium text-indigo-800 hover:underline"
						>
							Auto-pull every 15 minutes
						</button>
					</label>
				</form>
			</div>
		</div>

		<!-- Database Cleanup -->
		<div class="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
			<h2 class="text-lg font-bold text-yellow-700">Database Cleanup</h2>
			<p class="mb-4 text-sm text-yellow-600">
				Clean up orphaned records. This will safely delete any matches or teams that do not have
				any associated scouting or pit reports.
			</p>
			<Button color="yellow" onclick={() => (cleanupModalOpen = true)}>Clean Up Database</Button>
		</div>

		<!-- Report Fixer -->
		<div class="rounded-xl border border-orange-200 bg-orange-50 p-6">
			<h2 class="text-lg font-bold text-orange-700">Report Fixer</h2>
			<p class="mb-4 text-sm text-orange-600">
				Find and fix scouting reports with wrong team numbers. Also remove ghost teams created by bad scans.
			</p>
			<a href="/admin/reports" class="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
				Open Report Fixer
			</a>
		</div>

		<!-- Danger Zone -->
		<div class="rounded-xl border border-red-200 bg-red-50 p-6">
			<h2 class="text-lg font-bold text-red-700">Danger Zone</h2>
			<p class="mb-4 text-sm text-red-600">
				Wiping the database will permanently delete all matches, teams, and scouting reports. This
				action cannot be undone.
			</p>
			<Button color="red" onclick={() => (wipeModalOpen = true)}>Wipe Database</Button>
		</div>
	</div>
</div>

<Modal title="Confirm Database Cleanup" bind:open={cleanupModalOpen} autoclose size="sm">
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-yellow-500" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Are you sure you want to remove all unused matches and teams?
		</h3>
		<form method="POST" action="?/cleanupDatabase" use:enhance>
			<Button color="yellow" type="submit" class="me-2">Yes, clean up</Button>
			<Button color="alternative">No, cancel</Button>
		</form>
	</div>
</Modal>

<Modal title="Confirm Database Wipe" bind:open={wipeModalOpen} autoclose size="sm">
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Are you absolutely sure you want to delete ALL data?
		</h3>
		<form method="POST" action="?/wipeDatabase" use:enhance>
			<Button color="red" type="submit" class="me-2">Yes, I'm sure</Button>
			<Button color="alternative">No, cancel</Button>
		</form>
	</div>
</Modal>
