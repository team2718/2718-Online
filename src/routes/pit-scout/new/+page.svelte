<script lang="ts">
	import type { PitScoutReportData } from '$lib';
	import { deserialize } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const props = $props<{ data: { prefillTeam: string } }>();

	const createEmptyForm = (teamNumber = '', scoutName = ''): PitScoutReportData => ({
		scoutName,
		teamNumber,
		driverYOE: 'N/A',
		hopperCapacity: 'N/A',
		drivetrain: 'N/A',
		shooterType: 'N/A',
		intakeType: 'N/A',
		autoFeatures: [],
		autoStart: 'N/A',
		climb: 'N/A',
		canGoUnderTrench: false,
		fuelPerSecond: '',
		weightLbs: '',
		knownIssues: '',
		comments: '',
		timestamp: ''
	});

	let form = $state<PitScoutReportData>(createEmptyForm());
	let saved = $state(false);
	let error = $state('');
	let submitting = $state(false);

	onMount(() => {
		const cachedName = localStorage.getItem('2718_scouter_name') ?? '';
		if (cachedName && !form.scoutName) {
			form.scoutName = cachedName;
		}
	});

	$effect(() => {
		if (!form.teamNumber && props.data.prefillTeam) {
			form.teamNumber = props.data.prefillTeam;
		}
	});

	const OPTIONS = {
		hopper: ['N/A', '0-10', '11-20', '21-40', '41-60', '61-80', '81+'],
		drivetrain: ['N/A', 'Tank', 'Swerve', 'Mecanum', 'Other'],
		shooter: [
			'N/A',
			'Turret - Single',
			'Turret - Dual',
			'Static - Single',
			'Static - Dual',
			'Static - Triple',
			'Other'
		],
		intake: [
			'N/A',
			'Full Width - Over the Bumper',
			'Full Width - Gap in Bumper',
			'Half Width - Over the Bumper',
			'Half Width - Gap in Bumper',
			'Other'
		],
		climb: ['N/A', 'No Climb', 'L1', 'L2', 'L3'],
		yoe: ['N/A', '0-1 years', '2 years', '3 years', '4+ years'],
		autoStart: [
			'N/A',
			'Dont care',
			'Depot side under trench',
			'Depot side by ramp',
			'Center',
			'Outpost side by ramp',
			'Outpost side under trench'
		],
		autoFeatures: [
			{ key: 'scorePreload', label: 'Score preload fuel' },
			{ key: 'intakeMiddle', label: 'Intake center fuel' },
			{ key: 'intakeDepot', label: 'Intake from Depot' },
			{ key: 'intakeOutpost', label: 'Intake from Outpost' },
			{ key: 'climb', label: 'Climb in Auto' }
		]
	};

	function toggleAuto(key: string) {
		const autoFeatures = form.autoFeatures ?? [];
		form.autoFeatures = autoFeatures.includes(key)
			? autoFeatures.filter((featureKey) => featureKey !== key)
			: [...autoFeatures, key];
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (submitting) return;

		if (form.scoutName) {
			localStorage.setItem('2718_scouter_name', form.scoutName.trim());
		}

		error = '';
		submitting = true;
		form.timestamp = new Date().toISOString();

		try {
			const formData = new FormData();
			formData.append('data', JSON.stringify(form));

			const response = await fetch('?/submit', {
				method: 'POST',
				body: formData,
				headers: { 'x-sveltekit-action': 'true' }
			});

			const result = deserialize(await response.text());

			if (result.type === 'success') {
				saved = true;
				const currentScouter = form.scoutName;
				form = createEmptyForm(props.data.prefillTeam ?? '', currentScouter);
			} else if (result.type === 'failure' && 'data' in result) {
				error = String(result.data?.message ?? 'Please check required fields.');
			} else {
				error = 'A server error occurred.';
			}
		} catch {
			error = 'A server error occurred.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="mx-auto max-w-3xl space-y-6 px-4 py-4 sm:py-8">
	<!-- Header -->
	<div class="border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
		<a
			href="/pit-scout"
			class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
		>
			<svg
				class="h-3.5 w-3.5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
			</svg>
			Back to Pit Directory
		</a>
		<div class="mt-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
			<div>
				<h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
					Pit Inspection Form
				</h1>
				<p class="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
					Record robot hardware specifications, mechanisms, and driver experience.
				</p>
			</div>

			{#if error}
				<div
					class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
				>
					{error}
				</div>
			{/if}
		</div>
	</div>

	<!-- Form Content -->
	<form onsubmit={save} class="space-y-6">
		<!-- General Information -->
		<div
			class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div
				class="border-b border-slate-100 bg-slate-50/75 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/50"
			>
				<h2 class="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
					1. Scouter & Team Details
				</h2>
			</div>
			<div class="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
				<div>
					<label for="scoutName" class="block text-xs font-bold text-slate-700 dark:text-slate-300">
						Your Name (Scouter) *
					</label>
					<input
						id="scoutName"
						type="text"
						bind:value={form.scoutName}
						placeholder="e.g. Alex"
						required
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					/>
				</div>

				<div>
					<label
						for="teamNumber"
						class="block text-xs font-bold text-slate-700 dark:text-slate-300"
					>
						Team Number (Being Scouted) *
					</label>
					<input
						id="teamNumber"
						type="number"
						bind:value={form.teamNumber}
						placeholder="e.g. 2718"
						required
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					/>
				</div>

				<div>
					<label for="driverYOE" class="block text-xs font-bold text-slate-700 dark:text-slate-300">
						Driver Experience
					</label>
					<select
						id="driverYOE"
						bind:value={form.driverYOE}
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					>
						{#each OPTIONS.yoe as y}<option>{y}</option>{/each}
					</select>
				</div>
			</div>
		</div>

		<!-- Mechanical Specs -->
		<div
			class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div
				class="border-b border-slate-100 bg-slate-50/75 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/50"
			>
				<h2 class="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
					2. Hardware & Mechanisms
				</h2>
			</div>
			<div class="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
				<div>
					<label
						for="drivetrain"
						class="block text-xs font-bold text-slate-700 dark:text-slate-300"
					>
						Drivetrain Type
					</label>
					<select
						id="drivetrain"
						bind:value={form.drivetrain}
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					>
						{#each OPTIONS.drivetrain as d}<option>{d}</option>{/each}
					</select>
				</div>

				<div>
					<label
						for="hopperCapacity"
						class="block text-xs font-bold text-slate-700 dark:text-slate-300"
					>
						Hopper Fuel Capacity
					</label>
					<select
						id="hopperCapacity"
						bind:value={form.hopperCapacity}
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					>
						{#each OPTIONS.hopper as h}<option>{h}</option>{/each}
					</select>
				</div>

				<div>
					<label
						for="shooterType"
						class="block text-xs font-bold text-slate-700 dark:text-slate-300"
					>
						Shooter Mechanism
					</label>
					<select
						id="shooterType"
						bind:value={form.shooterType}
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					>
						{#each OPTIONS.shooter as s}<option>{s}</option>{/each}
					</select>
				</div>

				<div>
					<label
						for="intakeType"
						class="block text-xs font-bold text-slate-700 dark:text-slate-300"
					>
						Intake Mechanism
					</label>
					<select
						id="intakeType"
						bind:value={form.intakeType}
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					>
						{#each OPTIONS.intake as i}<option>{i}</option>{/each}
					</select>
				</div>

				<div>
					<label for="weightLbs" class="block text-xs font-bold text-slate-700 dark:text-slate-300">
						Weight (lbs)
					</label>
					<input
						id="weightLbs"
						type="number"
						bind:value={form.weightLbs}
						placeholder="e.g. 115"
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					/>
				</div>

				<div>
					<label
						for="fuelPerSecond"
						class="block text-xs font-bold text-slate-700 dark:text-slate-300"
					>
						Estimated Fuel / Second
					</label>
					<input
						id="fuelPerSecond"
						type="text"
						bind:value={form.fuelPerSecond}
						placeholder="e.g. 3.5"
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					/>
				</div>

				<div>
					<label for="climb" class="block text-xs font-bold text-slate-700 dark:text-slate-300">
						Maximum Climb Ability
					</label>
					<select
						id="climb"
						bind:value={form.climb}
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					>
						{#each OPTIONS.climb as climbOption}<option>{climbOption}</option>{/each}
					</select>
				</div>

				<div class="flex items-center sm:col-span-2">
					<label
						class="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition-colors hover:bg-cyan-50/40 dark:border-slate-800 dark:bg-slate-800/40"
					>
						<span class="text-xs font-bold text-slate-800 dark:text-slate-200"
							>Can Go Under Low Trench</span
						>
						<input
							type="checkbox"
							bind:checked={form.canGoUnderTrench}
							class="h-5 w-5 rounded-md border-slate-300 text-cyan-600 focus:ring-cyan-500"
						/>
					</label>
				</div>
			</div>
		</div>

		<!-- Autonomous -->
		<div
			class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div
				class="border-b border-slate-100 bg-slate-50/75 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/50"
			>
				<h2 class="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
					3. Autonomous Capabilities
				</h2>
			</div>
			<div class="space-y-4 p-5">
				<div>
					<label for="autoStart" class="block text-xs font-bold text-slate-700 dark:text-slate-300">
						Preferred Starting Position
					</label>
					<select
						id="autoStart"
						bind:value={form.autoStart}
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					>
						{#each OPTIONS.autoStart as a}<option>{a}</option>{/each}
					</select>
				</div>

				<div>
					<p class="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">
						Auto Routines & Features
					</p>
					<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
						{#each OPTIONS.autoFeatures as feature}
							<label
								class="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition-colors hover:bg-cyan-50/40 dark:border-slate-800 dark:bg-slate-800/40"
							>
								<span class="text-xs font-semibold text-slate-800 dark:text-slate-200"
									>{feature.label}</span
								>
								<input
									type="checkbox"
									checked={(form.autoFeatures ?? []).includes(feature.key)}
									onchange={() => toggleAuto(feature.key)}
									class="h-5 w-5 rounded-md border-slate-300 text-cyan-600 focus:ring-cyan-500"
								/>
							</label>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Notes & Issues -->
		<div
			class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div
				class="border-b border-slate-100 bg-slate-50/75 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/50"
			>
				<h2 class="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-300">
					4. Strategy & Notes
				</h2>
			</div>
			<div class="space-y-4 p-5">
				<div>
					<label
						for="knownIssues"
						class="block text-xs font-bold text-slate-700 dark:text-slate-300"
					>
						Known Issues / Failure Modes
					</label>
					<textarea
						id="knownIssues"
						bind:value={form.knownIssues}
						rows="2"
						placeholder="e.g. Belt slips under high load, intake occasionally jams"
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					></textarea>
				</div>

				<div>
					<label for="comments" class="block text-xs font-bold text-slate-700 dark:text-slate-300">
						General Pit Observations
					</label>
					<textarea
						id="comments"
						bind:value={form.comments}
						rows="3"
						placeholder="e.g. Clean electrical wiring, very organized drive team, fast cycle potential"
						class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					></textarea>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex items-center justify-end gap-3 pt-2">
			<button
				type="button"
				onclick={() => (form = createEmptyForm(props.data.prefillTeam ?? '', form.scoutName))}
				disabled={submitting}
				class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
			>
				Clear Form
			</button>
			<button
				type="submit"
				disabled={submitting}
				class="rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-cyan-700 active:bg-cyan-800 disabled:opacity-50"
			>
				{submitting ? 'Saving…' : 'Save Pit Report'}
			</button>
		</div>
	</form>
</div>

<!-- Saved Modal -->
{#if saved}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
	>
		<div
			class="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900"
		>
			<div
				class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
			>
				<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h2 class="mt-4 text-xl font-black text-slate-900 dark:text-white">Report Recorded!</h2>
			<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
				Pit scouting data has been stored and synced to team profiles.
			</p>
			<div class="mt-6 flex flex-col gap-2">
				<a
					href="/pit-scout"
					class="w-full rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-cyan-700"
				>
					Return to Pit Directory
				</a>
				<button
					type="button"
					onclick={() => (saved = false)}
					class="w-full rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
				>
					Scout Another Team
				</button>
			</div>
		</div>
	</div>
{/if}
