<script lang="ts">
	import { Badge, Listgroup, ListgroupItem, Button } from 'flowbite-svelte';
	import { ArrowLeftOutline, ChevronRightOutline, TrashBinSolid } from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';

	let { data } = $props();

	// Use $derived to reactively track changes to data
	const reports = $derived(data?.matchReports ?? []);
	const pitReports = $derived(data?.pitReports ?? []);

	// Derive unique match IDs from the match reports
	const matchesPlayed = $derived([...new Set(reports.map((r) => r.matchId))].sort());

	// Calculate average statistics for match reports
	const avgStats = $derived.by(() => {
		if (!reports || reports.length === 0) return null;

		const count = reports.length;
		const sum = reports.reduce(
			(acc, curr) => {
				const d = curr.data;
				return {
					autoFuel: acc.autoFuel + (Number(d?.autoFuel) || 0),
					autoFuelMissed: acc.autoFuelMissed + (Number(d?.autoFuelMissed) || 0),
					teleFuelRateScore: acc.teleFuelRateScore + (Number(d?.teleFuelRateScore) || 0),
					teleAccScore: acc.teleAccScore + (Number(d?.teleAccScore) || 0),
					telePassScore: acc.telePassScore + (Number(d?.telePassScore) || 0),
					teleDefScore: acc.teleDefScore + (Number(d?.teleDefScore) || 0),
					didLeave: acc.didLeave + (d?.didLeave ? 1 : 0),
					autoClimbed: acc.autoClimbed + (d?.autoClimbed ? 1 : 0)
				};
			},
			{
				autoFuel: 0,
				autoFuelMissed: 0,
				teleFuelRateScore: 0,
				teleAccScore: 0,
				telePassScore: 0,
				teleDefScore: 0,
				didLeave: 0,
				autoClimbed: 0
			}
		);

		return {
			autoFuel: (sum.autoFuel / count).toFixed(1),
			autoFuelMissed: (sum.autoFuelMissed / count).toFixed(1),
			teleFuelRateScore: (sum.teleFuelRateScore / count).toFixed(1),
			teleAccScore: (sum.teleAccScore / count).toFixed(1),
			telePassScore: (sum.telePassScore / count).toFixed(1),
			teleDefScore: (sum.teleDefScore / count).toFixed(1),
			didLeavePercent: Math.round((sum.didLeave / count) * 100),
			autoClimbedPercent: Math.round((sum.autoClimbed / count) * 100),
			reportCount: count
		};
	});

	// Helper to format camelCase keys from autoFeatures into readable text
	const formatFeature = (key: string) => {
		return key
			.replace(/([A-Z])/g, ' $1') // Add space before capitals
			.replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
	};
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-7xl px-4 py-8">
		<div class="mb-8 flex items-start gap-4">
			<Button href="/teams" color="light" pill size="sm" class="mt-1 shrink-0">
				<ArrowLeftOutline class="mr-2 h-4 w-4" /> Teams
			</Button>
			<div>
				<h1 class="text-4xl font-black tracking-tight text-gray-900">Team {data.teamnum}</h1>
				{#if data.team}
					<p class="mt-1 text-lg font-semibold text-gray-600">{data.team.name}</p>
					{#if (data.team.metadata as Record<string, unknown>)?.state_prov}
						<p class="mt-0.5 text-sm text-gray-400">
							{[(data.team.metadata as Record<string, unknown>)?.city, (data.team.metadata as Record<string, unknown>)?.state_prov, (data.team.metadata as Record<string, unknown>)?.country].filter(Boolean).join(', ')}
						</p>
					{/if}
				{/if}
			</div>
		</div>

		<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
			<div class="space-y-6 lg:col-span-8">
				<div>
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-bold text-gray-800">Average Match Statistics</h2>
						{#if avgStats}
							<Badge color="green">{avgStats.reportCount} Matches</Badge>
						{/if}
					</div>

					{#if avgStats}
						<div
							class="mb-8 grid grid-cols-2 gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-4"
						>
							<div>
								<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
									Auto Fuel Scored
								</p>
								<p class="text-2xl font-bold text-gray-900">{avgStats.autoFuel}</p>
							</div>
							<div>
								<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
									Auto Fuel Missed
								</p>
								<p class="text-2xl font-bold text-gray-900">{avgStats.autoFuelMissed}</p>
							</div>
							<div>
								<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
									Moved in Auto
								</p>
								<p class="text-2xl font-bold text-gray-900">{avgStats.didLeavePercent}%</p>
							</div>
							<div>
								<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Auto Climb</p>
								<p class="text-2xl font-bold text-gray-900">{avgStats.autoClimbedPercent}%</p>
							</div>
							<div>
								<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
									Teleop Fuel Rate
								</p>
								<p class="text-2xl font-bold text-gray-900">
									{avgStats.teleFuelRateScore}<span class="text-sm font-normal text-gray-500">
										/ 5</span
									>
								</p>
							</div>
							<div>
								<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
									Teleop Accuracy
								</p>
								<p class="text-2xl font-bold text-gray-900">
									{avgStats.teleAccScore}<span class="text-sm font-normal text-gray-500"> / 5</span>
								</p>
							</div>
							<div>
								<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
									Teleop Passing
								</p>
								<p class="text-2xl font-bold text-gray-900">
									{avgStats.telePassScore}<span class="text-sm font-normal text-gray-500">
										/ 5</span
									>
								</p>
							</div>
							<div>
								<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
									Defense Rating
								</p>
								<p class="text-2xl font-bold text-gray-900">
									{avgStats.teleDefScore}<span class="text-sm font-normal text-gray-500"> / 5</span>
								</p>
							</div>
						</div>
					{:else}
						<div
							class="mb-8 rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center"
						>
							<p class="text-gray-400">No match data available to calculate averages.</p>
						</div>
					{/if}
				</div>

				<div class="flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-800">Pit Reports</h2>
					<Badge color="blue">{pitReports.length} Reports</Badge>
				</div>

				{#if pitReports.length > 0}
					{#each pitReports as report}
						<div class="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
							<div class="flex items-center justify-between border-b bg-gray-50 px-6 py-3 text-sm">
								<div>
									<span class="font-semibold text-blue-600">
										Scouted by {report.data.scoutName || 'Unknown'}
									</span>
									<span class="ml-2 text-gray-500">
										{report.data.timestamp
											? new Date(report.data.timestamp).toLocaleString()
											: 'No Date'}
									</span>
								</div>

								{#if data.isAdmin}
									<form method="POST" action="?/deletePitReport" use:enhance>
										<input type="hidden" name="id" value={report.id} />
										<Button
											type="submit"
											color="red"
											size="xs"
											class="!p-1.5"
											title="Delete Pit Report"
										>
											<TrashBinSolid class="h-4 w-4" />
										</Button>
									</form>
								{/if}
							</div>

							<div class="grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Drivetrain</p>
									<p class="font-medium text-gray-900">{report.data.drivetrain}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Shooter</p>
									<p class="font-medium text-gray-900">{report.data.shooterType}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Intake</p>
									<p class="font-medium text-gray-900">{report.data.intakeType}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Max Climb</p>
									<p class="font-medium text-gray-900">{report.data.climb}</p>
								</div>

								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Weight</p>
									<p class="font-medium text-gray-900">{report.data.weightLbs || '??'} lbs</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Fuel / Sec</p>
									<p class="font-medium text-gray-900">{report.data.fuelPerSecond || 'N/A'}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Hopper</p>
									<p class="font-medium text-gray-900">{report.data.hopperCapacity}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Driver Exp</p>
									<p class="font-medium text-gray-900">{report.data.driverYOE}</p>
								</div>

								<div class="col-span-2 border-t border-gray-100 pt-4 md:col-span-4">
									<p class="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
										Autonomous Capabilities
									</p>
									<div class="space-y-3">
										<div class="text-sm">
											<span class="text-gray-500 italic">Preferred Start:</span>
											<span class="ml-2 font-semibold text-gray-800">{report.data.autoStart}</span>
										</div>
										<div class="flex flex-wrap gap-2">
											{#if report.data.autoFeatures?.length > 0}
												{#each report.data.autoFeatures as feature}
													<Badge color="green" rounded class="px-3 py-1">
														{formatFeature(feature)}
													</Badge>
												{/each}
											{:else}
												<span class="text-sm text-gray-400 italic">No auto features reported.</span>
											{/if}
										</div>
									</div>
								</div>

								<div
									class="col-span-2 grid gap-4 border-t border-gray-100 pt-4 md:col-span-4 md:grid-cols-2"
								>
									<div class="rounded-lg border border-red-100 bg-red-50 p-4">
										<p class="text-xs font-bold tracking-wider text-red-700 uppercase">
											Weak Points / Issues
										</p>
										<p class="mt-1 text-sm text-gray-700 italic">
											{report.data.knownIssues || 'No known issues reported.'}
										</p>
									</div>
									<div class="rounded-lg border border-blue-100 bg-blue-50 p-4">
										<p class="text-xs font-bold tracking-wider text-blue-700 uppercase">
											Scouter Comments
										</p>
										<p class="mt-1 text-sm text-gray-700 italic">
											{report.data.comments || 'No additional comments.'}
										</p>
									</div>
								</div>
							</div>
						</div>
					{/each}
				{:else}
					<div class="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
						<p class="mb-4 text-gray-400">No pit data available for this team yet.</p>
					</div>
				{/if}
			</div>

			<div class="lg:col-span-4">
				<div class="sticky top-8">
					<h2 class="mb-4 text-xl font-bold text-gray-800">Match History</h2>
					<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
						<Listgroup class="border-0">
							{#each matchesPlayed as matchId}
								<ListgroupItem
									href="/matches/{matchId}"
									class="group transition-colors hover:bg-blue-50"
								>
									<div class="flex w-full items-center justify-between">
										<span class="font-medium text-gray-700 group-hover:text-blue-700"
											>Match {matchId}</span
										>
										<ChevronRightOutline class="h-4 w-4 text-gray-400 group-hover:text-blue-400" />
									</div>
								</ListgroupItem>
							{/each}
						</Listgroup>
						{#if matchesPlayed.length === 0}
							<div class="p-8 text-center text-sm text-gray-400 italic">
								No match reports recorded.
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
