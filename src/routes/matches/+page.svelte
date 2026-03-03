<script lang="ts">
	import { Badge, Button, Card, Heading } from 'flowbite-svelte';
	import { UsersGroupOutline, ChevronRightOutline } from 'flowbite-svelte-icons';

	let { data } = $props();

	const reports = $derived(data?.reports ?? []);
	const matches = $derived(data?.matches ?? []);

	const getReportsForMatch = (matchId: string) => {
		return reports.filter((r) => r.matchId === matchId);
	};

	// Helper to get unique teams for an alliance from reports
	const TeamsByAlliance = (matchId: string, alliance: number) => {
		const matchReports = getReportsForMatch(matchId);
		// ScoutingReportData: alliance 0 = Red, 1 = Blue
		return [
			...new Set(matchReports.filter((r) => r.data?.alliance === alliance).map((r) => r.teamNumber))
		];
	};
</script>

<div class="mx-auto mt-px max-w-7xl py-4">
	<Heading tag="h1" class="mb-4 px-4 text-3xl font-bold">Matches</Heading>

	{#if data.matches.length > 0}
		<div class="mx-auto max-w-7xl px-4">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each matches as match}
					{@const matchReports = getReportsForMatch(match.id)}
					{@const redTeams = TeamsByAlliance(match.id, 0)}
					{@const blueTeams = TeamsByAlliance(match.id, 1)}

					<div
						class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
					>
						<div
							class="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-5 py-4"
						>
							<span class="text-lg font-bold text-gray-700">Match #{match.matchNumber}</span>
							{#if matchReports.length > 0}
								<Badge color="green" rounded pill>
									<UsersGroupOutline class="mr-1 h-3 w-3" />
									{matchReports.length} Reports
								</Badge>
							{:else}
								<Badge color="dark" rounded pill>Upcoming</Badge>
							{/if}
						</div>

						<div class="p-5">
							<div class="grid grid-cols-7 items-center gap-2">
								<div class="col-span-3 space-y-2">
									<div
										class="text-center text-[10px] font-bold tracking-widest text-red-500 uppercase"
									>
										Red Alliance
									</div>
									<div class="flex flex-col gap-1">
										{#each redTeams as team}
											<a
												href="/teams/{team}"
												class="block rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-center font-bold text-red-700 hover:bg-red-100"
												>{team}</a
											>
										{:else}
											<div
												class="rounded-lg border border-dashed border-gray-200 py-2 text-center text-xs text-gray-400"
											>
												No Data
											</div>
										{/each}
									</div>
								</div>

								<div class="col-span-1 flex flex-col items-center justify-center">
									<div class="relative h-full w-px bg-gray-200">
										<span
											class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1 text-[10px] font-black text-gray-400"
											>VS</span
										>
									</div>
								</div>

								<div class="col-span-3 space-y-2">
									<div
										class="text-center text-[10px] font-bold tracking-widest text-blue-500 uppercase"
									>
										Blue Alliance
									</div>
									<div class="flex flex-col gap-1">
										{#each blueTeams as team}
											<a
												href="/teams/{team}"
												class="block rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-center font-bold text-blue-700 hover:bg-blue-100"
												>{team}</a
											>
										{:else}
											<div
												class="rounded-lg border border-dashed border-gray-200 py-2 text-center text-xs text-gray-400"
											>
												No Data
											</div>
										{/each}
									</div>
								</div>
							</div>
						</div>

						<a
							href="/matches/{match.id}"
							class="group block w-full border-t border-gray-100 bg-white px-5 py-3 text-sm font-semibold text-gray-500 hover:text-blue-600"
						>
							<div class="flex items-center justify-between">
								<span>View Match Details</span>
								<ChevronRightOutline
									class="h-4 w-4 transition-transform group-hover:translate-x-1"
								/>
							</div>
						</a>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<p class="px-4 text-gray-500">No matches have been scouted yet.</p>
	{/if}
</div>
