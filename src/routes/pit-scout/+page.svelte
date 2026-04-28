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
			<Heading tag="h1" class="text-3xl font-bold">Pit Scouting</Heading>
			<a href="https://frc.nexus/en/event/2026daly/team/2718/map" target="_blank" rel="noopener noreferrer" class="mt-1 inline-block text-sm font-medium text-blue-600 hover:underline">View Pit Map →</a>
			{#if teams.length > 0}
				<p class="mt-1 text-sm text-gray-500">
					<span class="font-semibold text-green-600">{scouted} scouted</span>
					&nbsp;&bull;&nbsp;
					<span class="font-semibold text-orange-500">{unscouted} remaining</span>
					&nbsp;of {teams.length} teams
				</p>
			{/if}
		</div>
		<!-- <Button href="/pit-scout/new" color="blue">+ New Pit Report</Button> -->
	</div>

	{#if teams.length > 0}
		<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
			{#each teams as team, i}
				<div class="flex items-center justify-between px-4 py-3 {i > 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50">
					<div class="flex min-w-0 flex-1 items-center gap-3">
						{#if team.pitScouted}
							<CheckCircleSolid class="h-5 w-5 shrink-0 text-green-500" />
						{:else}
							<CloseCircleSolid class="h-5 w-5 shrink-0 text-orange-400" />
						{/if}
						<div class="min-w-0">
							<p class="font-semibold text-gray-800">Team {team.number}</p>
							<p class="truncate text-sm text-gray-500">{team.name}</p>
						</div>
					</div>
					<div class="ml-4 shrink-0">
						<Button
							href="/pit-scout/new?team={team.number}"
							color={team.pitScouted ? 'gray' : 'blue'}
							disabled={team.pitScouted}
						>
							Scout &rarr;
						</Button>
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
