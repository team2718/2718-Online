<script lang="ts">
	export let data;
	const { report } = data;
	const d = report.data!;

	// Helper to translate numeric codes from the example_report.json
	const alliance = d.alliance === 0 ? 'Blue' : 'Red';
	const climbStatus = ['No Climb', 'Parked', 'Climbed', 'Level'][d.climbType] || 'Unknown';
</script>

<main class="p-6 max-w-4xl mx-auto">
	<header class="mb-6 border-b pb-4">
		<a href="/reports" class="text-blue-600 hover:underline">← Back to List</a>
		<h1 class="text-3xl font-bold mt-2">Match {report.matchId} Report</h1>
		<h2 class="text-xl text-gray-600">Team {report.teamNumber} — {alliance} Alliance</h2>
	</header>

	<div class="grid md:grid-cols-2 gap-8">
		<section class="bg-white p-6 rounded-xl shadow-sm border">
			<h3 class="font-bold text-lg mb-3 border-b pb-2">Autonomous</h3>
			<ul class="space-y-2">
				<li><strong>Starting Position:</strong> {d.startingPosition}</li>
				<li><strong>Left Tarmac:</strong> {d.didLeave ? 'Yes' : 'No'}</li>
				<li><strong>Fuel Scored:</strong> {d.autoFuel}</li>
				<li><strong>Fuel Missed:</strong> {d.autoFuelMissed}</li>
				<li><strong>Auto Climb:</strong> {d.autoClimbed ? 'Yes' : 'No'}</li>
			</ul>
		</section>

		<section class="bg-white p-6 rounded-xl shadow-sm border">
			<h3 class="font-bold text-lg mb-3 border-b pb-2">Teleop & Endgame</h3>
			<ul class="space-y-2">
				<li><strong>Climb Result:</strong> {climbStatus}</li>
				<li><strong>Fuel Rate Score:</strong> {d.teleFuelRateScore}/5</li>
				<li><strong>Accuracy:</strong> {d.teleAccScore}/5</li>
				<li><strong>Defense:</strong> {d.teleDefScore}/5</li>
			</ul>
		</section>
	</div>

	{#if d.notes}
		<section class="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
			<h3 class="font-bold mb-1">Scouter Notes:</h3>
			<p>{d.notes}</p>
		</section>
	{/if}

	<footer class="mt-8 pt-4 text-sm text-gray-500 border-t">
		Scouted by {report.scouterName} on {new Date(report.createdAt! * 1000).toLocaleString()}
	</footer>
</main>