<script lang="ts">
	import { Button, Modal, Alert } from 'flowbite-svelte';
	import { ExclamationCircleOutline, InfoCircleSolid } from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';

	let { form } = $props();

	let wipeModalOpen = $state(false);
	let cleanupModalOpen = $state(false);
</script>

<div class="mx-auto max-w-7xl px-4 py-10">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Admin Dashboard</h1>
		<form method="POST" action="?/logout" use:enhance>
			<Button color="alternative" type="submit">Log out</Button>
		</form>
	</div>

	{#if form?.success && form?.action === 'cleanup'}
		<Alert color="green" class="mb-6 border border-green-200">
			<div class="flex items-center gap-2 text-lg font-bold text-green-800">
				<InfoCircleSolid class="h-6 w-6" />
				Database Cleanup Successful
			</div>
			<div class="mt-4 text-sm text-green-700 space-y-2">
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

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
			<h2 class="text-lg font-bold text-yellow-700">Database Cleanup</h2>
			<p class="mb-4 text-sm text-yellow-600">
				Clean up orphaned records. This will safely delete any matches or teams that do not have any associated scouting or pit reports.
			</p>
			
			<Button color="yellow" onclick={() => (cleanupModalOpen = true)}>Clean Up Database</Button>
		</div>

		<div class="rounded-xl border border-red-200 bg-red-50 p-6">
			<h2 class="text-lg font-bold text-red-700">Danger Zone</h2>
			<p class="mb-4 text-sm text-red-600">
				Wiping the database will permanently delete all matches, teams, and scouting reports. This action cannot be undone.
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