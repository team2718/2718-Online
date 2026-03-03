<script lang="ts">
	import { Card, Heading } from 'flowbite-svelte';
</script>

<div class="mt-px py-8 max-w-7xl mx-auto px-4">
	<Heading tag="h1" class="mb-10 text-4xl font-extrabold text-center tracking-tight text-gray-900 dark:text-white">
		2718 Online
	</Heading>

	<div class="mb-8">
		<Heading tag="h2" class="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-300">View Data</Heading>
		<div class="grid gap-6 md:grid-cols-2">
			<Card href="/teams" class="max-w-none p-4 shadow-sm sm:p-6 transition hover:shadow-lg hover:-translate-y-1">
				<Heading tag="h3" class="mb-2 text-xl font-bold text-blue-600">Teams</Heading>
				<p class="text-gray-500 dark:text-gray-400">View detailed dashboards and match history for each scouted team.</p>
			</Card>

			<Card href="/matches" class="max-w-none p-4 shadow-sm sm:p-6 transition hover:shadow-lg hover:-translate-y-1">
				<Heading tag="h3" class="mb-2 text-xl font-bold text-blue-600">Matches</Heading>
				<p class="text-gray-500 dark:text-gray-400">Browse scouting reports organized by match number.</p>
			</Card>
		</div>
	</div>

	<div>
		<Heading tag="h2" class="mb-4 text-2xl font-bold text-gray-700 dark:text-gray-300">Collect Data</Heading>
		<div class="grid gap-6 md:grid-cols-2">
			<Card href="/scan" class="max-w-none p-4 shadow-sm sm:p-6 transition hover:shadow-lg hover:-translate-y-1 border-t-4 border-t-green-500">
				<Heading tag="h3" class="mb-2 text-xl font-bold text-green-600">Scan QR</Heading>
				<p class="text-gray-500 dark:text-gray-400">Scan match scouting QR codes from scouter devices to upload results.</p>
			</Card>

			<Card href="/pit-scout" class="max-w-none p-4 shadow-sm sm:p-6 transition hover:shadow-lg hover:-translate-y-1 border-t-4 border-t-green-500">
				<Heading tag="h3" class="mb-2 text-xl font-bold text-green-600">Pit Scout</Heading>
				<p class="text-gray-500 dark:text-gray-400">Fill out and save pit scouting information for teams in the pits.</p>
			</Card>
		</div>
	</div>
</div>