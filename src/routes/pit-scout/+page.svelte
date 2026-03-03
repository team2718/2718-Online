<script lang="ts">
	const createEmptyForm = () => ({
		scoutName: '',
		teamNumber: '',
		driverYOE: 'N/A',
		hopperCapacity: 'N/A',
		drivetrain: 'N/A',
		shooterType: 'N/A',
		intakeType: 'N/A',
		autoFeatures: [] as string[],
		autoStart: 'N/A',
		climb: 'N/A',
		maxSpeedFtPerS: '',
		weightLbs: '',
		electricalIssues: '',
		comments: ''
	});

	let form = createEmptyForm();
	let saved = false;

	const SECTIONS = {
		INFO: ['scoutName', 'teamNumber'],
		SPECS: ['drivetrain', 'hopperCapacity', 'shooterType', 'intakeType'],
		AUTO: ['autoStart', 'autoFeatures'],
		ENDGAME: ['climb', 'driverYOE']
	};

	const OPTIONS = {
		hopper: ['N/A', '0-10', '11-20', '21-40', '41-60', '61-80', '81+'],
		drivetrain: ['N/A', 'Tank', 'Swerve', 'Mecanum', 'Other'],
		shooter: ['N/A', 'Turret - Single', 'Turret - Dual', 'Static - Single', 'Static - Dual', 'Static - Triple', 'Other'],
		intake: ['N/A', 'Full Width - Over the Bumper', 'Full Width - Gap in Bumper', 'Half Width - Over the Bumper', 'Half Width - Gap in Bumper', 'Other'],
		climb: ['N/A', 'No Climb', 'L1', 'L2', 'L3'],
		yoe: ['N/A', '0-1 years', '2 years', '3 years', '4+ years'],
		autoStart: ['N/A', 'Dont care', 'Depot side under trench', 'Depot side by ramp', 'Center', 'Outpost side by ramp', 'Outpost side under trench'],
		autoFeatures: [
			{ key: 'scorePreload', label: 'Score preload' },
			{ key: 'intakeMiddle', label: 'Intake middle' },
			{ key: 'intakeDepot', label: 'Intake from Depot' },
			{ key: 'intakeOutpost', label: 'Intake from Outpost' },
			{ key: 'climb', label: 'Climb in Auto' }
		]
	};

	function toggleAuto(key: string) {
		form.autoFeatures = form.autoFeatures.includes(key)
			? form.autoFeatures.filter((k) => k !== key)
			: [...form.autoFeatures, key];
	}

	async function save() {
		console.log("Saving report...", form);
		saved = true;
		form = createEmptyForm();
		setTimeout(() => (saved = false), 3000);
	}
</script>

<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
	<div class="max-w-3xl mx-auto">
		<header class="mb-8 flex justify-between items-end">
			<div>
				<h1 class="text-3xl font-extrabold text-gray-900">Pit Scouting</h1>
				<p class="mt-2 text-sm text-gray-600">Gather technical specs directly from the team pits.</p>
			</div>
			{#if saved}
				<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded animate-bounce">Saved Successfully!</span>
			{/if}
		</header>

		<form on:submit|preventDefault={save} class="space-y-6">
			<section class="bg-white shadow rounded-lg p-6">
				<h2 class="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Identification</h2>
				<div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
					<div>
						<label for="scoutName" class="block text-sm font-medium text-gray-700">Scouter's Name *</label>
						<input id="scoutName" type="text" bind:value={form.scoutName} required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
					</div>
					<div>
						<label for="teamNumber" class="block text-sm font-medium text-gray-700">Team Number *</label>
						<input id="teamNumber" type="text" bind:value={form.teamNumber} required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
					</div>
				</div>
			</section>

			<section class="bg-white shadow rounded-lg p-6">
				<h2 class="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Mechanical Specs</h2>
				<div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
					<div>
						<label class="block text-sm font-medium text-gray-700">Drivetrain</label>
						<select bind:value={form.drivetrain} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
							{#each OPTIONS.drivetrain as d}<option>{d}</option>{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">Hopper Capacity</label>
						<select bind:value={form.hopperCapacity} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
							{#each OPTIONS.hopper as h}<option>{h}</option>{/each}
						</select>
					</div>
					<div class="sm:col-span-2">
						<label class="block text-sm font-medium text-gray-700">Shooter Type</label>
						<select bind:value={form.shooterType} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
							{#each OPTIONS.shooter as s}<option>{s}</option>{/each}
						</select>
					</div>
				</div>
			</section>

			<section class="bg-white shadow rounded-lg p-6">
				<h2 class="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Autonomous</h2>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700">Start Preference</label>
						<select bind:value={form.autoStart} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
							{#each OPTIONS.autoStart as a}<option>{a}</option>{/each}
						</select>
					</div>
					<fieldset>
						<legend class="text-sm font-medium text-gray-700">Capabilities</legend>
						<div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
							{#each OPTIONS.autoFeatures as feature}
								<label class="relative flex items-start py-2 px-3 border rounded-md cursor-pointer hover:bg-gray-50">
									<input type="checkbox" checked={form.autoFeatures.includes(feature.key)} on:change={() => toggleAuto(feature.key)} class="h-4 w-4 text-blue-600 border-gray-300 rounded" />
									<span class="ml-3 text-sm text-gray-600">{feature.label}</span>
								</label>
							{/each}
						</div>
					</fieldset>
				</div>
			</section>

			<section class="bg-white shadow rounded-lg p-6">
				<h2 class="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">Final Details</h2>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700">Known Weak Points</label>
						<textarea bind:value={form.electricalIssues} rows="2" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm" placeholder="e.g. Battery connector loose..."></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">General Comments</label>
						<textarea bind:value={form.comments} rows="3" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"></textarea>
					</div>
				</div>
			</section>

			<div class="flex items-center justify-end space-x-4 pt-4">
				<button type="button" on:click={() => form = createEmptyForm()} class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none ring-2 ring-offset-2 ring-blue-500">
					Clear Form
				</button>
				<button type="submit" class="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
					Save Report
				</button>
			</div>
		</form>
	</div>
</div>