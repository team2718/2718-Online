<script lang="ts">
	import { Badge, Button, Heading } from 'flowbite-svelte';
	import { CheckCircleSolid, CloseCircleSolid } from 'flowbite-svelte-icons';

	let { data } = $props();

	const teams = $derived(data?.teams ?? []);
	const scouted = $derived(teams.filter((t) => t.pitScouted).length);
	const unscouted = $derived(teams.filter((t) => !t.pitScouted).length);
</script>

<div class="mx-auto mt-px max-w-7xl px-4 py-4">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<div>
			<Heading tag="h1" class="text-3xl font-bold">Pit Scouts</Heading>
			{#if teams.length > 0}
				<p class="mt-1 text-sm text-gray-500">
					<span class="font-semibold text-green-600">{scouted} scouted</span>
					&nbsp;&bull;&nbsp;
					<span class="font-semibold text-orange-500">{unscouted} remaining</span>
					&nbsp;of {teams.length} teams
				</p>
			{/if}
		</div>
		<Button href="/pit-scout/new" color="blue">+ New Pit Report</Button>
	</div>

	{#if teams.length > 0}
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
			{#each teams as team, i}
				<div class="flex items-center justify-between px-4 py-3 {i > 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50">
					<div class="flex items-center gap-3">
						{#if team.pitScouted}
							<CheckCircleSolid class="h-5 w-5 shrink-0 text-green-500" />
						{:else}
							<CloseCircleSolid class="h-5 w-5 shrink-0 text-orange-400" />
						{/if}
						<div>
							<span class="font-semibold text-gray-800">Team {team.number}</span>
							<span class="ml-2 text-sm text-gray-500">{team.name}</span>
						</div>
					</div>
					<div class="flex items-center gap-3">
						{#if team.pitScouted}
							<Badge color="green" rounded>Scouted</Badge>
						{:else}
							<Badge color="yellow" rounded>Pending</Badge>
						{/if}
						<a
							href="/pit-scout/new?team={team.number}"
							class="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
						>
							Scout &rarr;
						</a>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
			<p class="mb-4 text-gray-400">No teams in the database yet.</p>
		</div>
	{/if}
</div>
