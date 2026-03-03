<script lang="ts">
	import { Button, Modal } from 'flowbite-svelte';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';

	let wipeModalOpen = $state(false);
</script>

<div class="mx-auto max-w-7xl px-4 py-10">
	<h1 class="mb-8 text-3xl font-bold">Admin Dashboard</h1>

	<div class="rounded-xl border border-red-200 bg-red-50 p-6">
		<h2 class="text-lg font-bold text-red-700">Danger Zone</h2>
		<p class="mb-4 text-sm text-red-600">
			Wiping the database will permanently delete all matches, teams, and scouting reports. This action cannot be undone.
		</p>
		
		<Button color="red" onclick={() => (wipeModalOpen = true)}>Wipe Database</Button>
	</div>
</div>

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