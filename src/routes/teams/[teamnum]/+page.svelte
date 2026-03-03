<script lang="ts">
	import { Badge, Listgroup, ListgroupItem, Button } from 'flowbite-svelte';
	import { ArrowLeftOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
	
	let { data } = $props();

	// Use $derived to reactively track changes to data and prevent "initial value" warnings
	const reports = $derived(data?.matchReports ?? []);
	const pitReports = $derived(data?.pitReports ?? []);
	
	// Derive unique match IDs (Strings) from the match reports
	const matchesPlayed = $derived([...new Set(reports.map(r => r.matchId))].sort());
</script>

<div class="bg-gray-50 min-h-screen">
	<div class="max-w-7xl mx-auto px-4 py-8">
		<div class="flex items-center mb-8">
			<Button href="/teams" color="light" pill size="sm" class="mr-4">
				<ArrowLeftOutline class="w-4 h-4 mr-2" /> Teams
			</Button>
			<h1 class="text-4xl font-black text-gray-900 tracking-tight">Team {data.teamnum}</h1>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
			<div class="lg:col-span-8 space-y-6">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-800">Pit Reports</h2>
					<Badge color="blue">{pitReports.length} Reports</Badge>
				</div>

				{#if pitReports.length > 0}
					{#each pitReports as report}
						<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
							<div class="bg-gray-50 px-6 py-3 border-b flex justify-between items-center text-sm">
								<span class="font-semibold text-blue-600">Scouted by {report.scouterName}</span>
								<span class="text-gray-500">{new Date(report.data.timestamp).toLocaleDateString()}</span>
							</div>
							
							<div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
								<div><p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Drivetrain</p><p class="text-gray-900">{report.data.drivetrain}</p></div>
								<div><p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Shooter</p><p class="text-gray-900">{report.data.shooterType}</p></div>
								<div><p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Intake</p><p class="text-gray-900">{report.data.intakeType}</p></div>
								<div><p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Max Climb</p><Badge color="dark">{report.data.climb}</Badge></div>
								
								<div class="col-span-2 md:col-span-4 border-t pt-4">
									<p class="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Auto Features</p>
									<div class="flex flex-wrap gap-2">
										{#each report.data.autoFeatures as feature}
											<Badge color="green" class="rounded-full px-3">{feature.replace(/([A-Z])/g, ' $1')}</Badge>
										{/each}
									</div>
								</div>

								<div class="col-span-2 md:col-span-4 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
									<p class="text-xs text-yellow-700 uppercase font-bold tracking-wider">Notes & Issues</p>
									<p class="text-gray-700 mt-1 italic">"{report.data.comments || 'No comments provided.'}"</p>
									{#if report.data.electricalIssues}
										<p class="text-red-600 mt-2 text-sm"><strong>Critical:</strong> {report.data.electricalIssues}</p>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				{:else}
					<div class="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
						<p class="text-gray-400">No pit data available for this team yet.</p>
						<Button href="/pit-scout" color="blue" class="mt-4">Go Scouting</Button>
					</div>
				{/if}
			</div>

			<div class="lg:col-span-4">
				<div class="sticky top-8">
					<h2 class="text-xl font-bold text-gray-800 mb-4">Match History</h2>
					<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
						<Listgroup class="border-0">
							{#each matchesPlayed as matchId}
								<ListgroupItem href="/matches/{matchId}" class="hover:bg-blue-50 transition-colors group">
									<div class="flex items-center justify-between w-full">
										<span class="font-medium text-gray-700 group-hover:text-blue-700">Match {matchId}</span>
										<ChevronRightOutline class="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
									</div>
								</ListgroupItem>
							{/each}
						</Listgroup>
						{#if matchesPlayed.length === 0}
							<div class="p-8 text-center text-gray-400 text-sm">No match data recorded.</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>