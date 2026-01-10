<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, fly, slide } from 'svelte/transition';

	let { data, form } = $props();

	let name = $state('');

	let adding = $state(false);
	let deleting: string[] = $state([]);

	let nameInput: HTMLInputElement; // reference to the input
</script>

<div class="mx-auto mt-8 max-w-xl">
	<div class="mb-8 rounded bg-white p-6 shadow">
		<h2 class="mb-4 text-xl font-bold">Add User</h2>

		<form
			method="POST"
			action="?/add"
			use:enhance={() => {
				adding = true;
				name = '';

				return async ({ update }) => {
					await update({ reset: false });
					adding = false;
					nameInput?.focus();
				};
			}}
			class="flex items-end gap-2"
		>
			<div class="flex-1">
				<label class="mb-1 block text-sm font-medium">
					Name
					<input
						name="name"
						class="w-full rounded border px-3 py-2"
						required
						autocomplete="off"
						bind:value={name}
						bind:this={nameInput}
					/>
				</label>
			</div>
			<submit class="rounded bg-blue-600 px-4 py-2 text-white" type="submit" disabled={adding}
				>Add</submit
			>
		</form>

		{#if form?.error}
			<div class="mt-2 text-red-600">{form.error}</div>
		{/if}
	</div>

	<div class="rounded bg-white p-6 shadow">
		<h2 class="mb-4 text-xl font-bold">All Users</h2>
		{#if !adding && data.users.length === 0}
			<div class="text-gray-500">No users found.</div>
		{:else}
			<ul>
				{#each data.users.filter((user) => !deleting.includes(user.id)) as user (user.id)}
					<li in:fly={{ y: 20 }} out:fade class="flex items-center justify-between py-2">
						<form
							method="POST"
							action="?/delete"
							use:enhance={() => {
								deleting = [...deleting, user.id];
								return async ({ update }) => {
									await update();
									deleting = deleting.filter((id) => id !== user.id);
								};
							}}
						>
							<input type="hidden" name="id" value={user.id} />
							<span>{user.name} ({user.id})</span>
							<button aria-label="Delete" class="text-red-600 hover:underline">Delete</button>
						</form>
					</li>
				{/each}
				{#if adding}
					<span>adding...</span>
				{/if}
			</ul>
		{/if}
	</div>
</div>
