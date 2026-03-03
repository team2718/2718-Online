<script lang="ts">
	import { resolve } from '$app/paths';
	let { data } = $props();
</script>

<div class="p-6 max-w-5xl mx-auto">
	<a href={resolve('/teams/')} class="text-blue-600 hover:underline">← Back to Teams</a>
	<h1 class="text-4xl font-extrabold my-6">Team {data.teamnum}</h1>

	<h2 class="text-2xl font-bold mb-4">Pit Scouting Details</h2>
	{#if data.pitReports && data.pitReports.length > 0}
		<div class="space-y-6">
			{#each data.pitReports as report}
				<div class="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm grid md:grid-cols-3 gap-4">
					<div class="md:col-span-3 border-b pb-2 mb-2 flex justify-between">
						<span class="font-bold text-lg">Report by {report.scouterName}</span>
						<span class="text-gray-500">{new Date(report.data.timestamp).toLocaleDateString()}</span>
					</div>
					
					<div><p class="text-gray-500 text-sm">Drivetrain</p><p class="font-medium">{report.data.drivetrain}</p></div>
					<div><p class="text-gray-500 text-sm">Shooter</p><p class="font-medium">{report.data.shooterType}</p></div>
					<div><p class="text-gray-500 text-sm">Intake</p><p class="font-medium">{report.data.intakeType}</p></div>
					
					<div><p class="text-gray-500 text-sm">Hopper Capacity</p><p class="font-medium">{report.data.hopperCapacity}</p></div>
					<div><p class="text-gray-500 text-sm">Max Speed (ft/s)</p><p class="font-medium">{report.data.maxSpeedFtPerS}</p></div>
					<div><p class="text-gray-500 text-sm">Weight (lbs)</p><p class="font-medium">{report.data.weightLbs}</p></div>
					
					<div><p class="text-gray-500 text-sm">Experience</p><p class="font-medium">{report.data.driverYOE}</p></div>
					<div><p class="text-gray-500 text-sm">Auto Start</p><p class="font-medium">{report.data.autoStart}</p></div>
					<div><p class="text-gray-500 text-sm">Climb</p><p class="font-medium">{report.data.climb}</p></div>

					<div class="md:col-span-3">
						<p class="text-gray-500 text-sm">Auto Features</p>
						<div class="flex gap-2 mt-1">
							{#each report.data.autoFeatures as feature}
								<span class="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
							{/each}
						</div>
					</div>

					<div class="md:col-span-3">
						<p class="text-gray-500 text-sm">Known Issues</p>
						<p class="italic text-gray-700">{report.data.electricalIssues || 'None reported'}</p>
					</div>
					<div class="md:col-span-3">
						<p class="text-gray-500 text-sm">Comments</p>
						<p class="text-gray-700">{report.data.comments || 'No additional comments'}</p>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-gray-500 italic">No pit scouting data recorded yet.</p>
	{/if}
</div>