<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card, Heading } from 'flowbite-svelte';

	let { data } = $props();
</script>

<div class="mt-px py-4 max-w-7xl mx-auto">
	<Heading tag="h1" class="px-4 mb-4 text-3xl font-bold">Teams</Heading>

	{#if data.teams.length > 0}
		<div class="grid gap-4 px-4 xl:grid-cols-4 2xl:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
			{#each data.teams as team}
				<Card size="xl" class="max-w-none p-4 shadow-sm sm:p-6 transition hover:shadow-md">
					<div class="items-center justify-between lg:flex">
						<div class="mt-px mb-4 lg:mb-0">
							<Heading tag="h3" class="mb-1 text-xl font-semibold dark:text-white">
								Team {team.number}
							</Heading>
							<p class="mb-2 text-sm text-gray-500">{team.name}</p>
							<a href={resolve(`/teams/${team.number}`)} class="text-blue-600 hover:text-blue-800 font-medium hover:underline">
								View Team Dashboard &rarr;
							</a>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{:else}
		<p class="px-4 text-gray-500">No teams found.</p>
	{/if}
</div>
