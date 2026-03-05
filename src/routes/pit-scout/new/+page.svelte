<script lang="ts">
    import type { PitScoutReportData } from "$lib";
    import { deserialize } from '$app/forms';

    const createEmptyForm = (): Partial<PitScoutReportData> => ({
        scoutName: '',
        teamNumber: '',
        driverYOE: 'N/A',
        hopperCapacity: 'N/A',
        drivetrain: 'N/A',
        shooterType: 'N/A',
        intakeType: 'N/A',
        autoFeatures: [],
        autoStart: 'N/A',
        climb: 'N/A',
        fuelPerSecond: '',
        weightLbs: '',
        knownIssues: '',
        comments: '',
        timestamp: ''
    });

    let form = $state(createEmptyForm());
    let saved = $state(false);
    let error = $state("");
    let submitting = $state(false);

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

    async function save(event: SubmitEvent) {
        event.preventDefault();
        if (submitting) return;

        error = "";
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
                form = createEmptyForm();
                setTimeout(() => (saved = false), 3000);
            } else {
                error = result.data?.message || "Please check required fields.";
            }
        } catch (e) {
            error = "A server error occurred.";
        } finally {
            submitting = false;
        }
    }
</script>

<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
        <header class="mb-8 flex justify-between items-end">
            <div>
                <a href="/pit-scout" class="text-sm text-blue-600 hover:underline mb-1 inline-block">&larr; Back to Pit Scout</a>
                <h1 class="text-3xl font-extrabold text-gray-900">Pit Scouting</h1>
            </div>
            <div class="flex flex-col items-end gap-1">
                {#if submitting}
                    <span class="text-blue-600 text-xs font-bold animate-pulse uppercase tracking-wider">Submitting...</span>
                {/if}
                {#if saved}
                    <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Saved Successfully!</span>
                {/if}
                {#if error}
                    <span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">{error}</span>
                {/if}
            </div>
        </header>

        <form onsubmit={save} class="space-y-6">
            <section class="bg-white shadow rounded-lg p-6 border-l-4 border-blue-600">
                <h2 class="text-lg font-semibold text-blue-700 mb-4 border-b pb-2">General</h2>
                <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                        <label for="scoutName" class="block text-sm font-medium text-gray-700">Your Name (Scouter) *</label>
                        <input id="scoutName" type="text" bind:value={form.scoutName} required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                        <label for="teamNumber" class="block text-sm font-medium text-gray-700">Team Number *</label>
                        <input id="teamNumber" type="number" bind:value={form.teamNumber} required
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Driver Experience</label>
                        <select bind:value={form.driverYOE} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                            {#each OPTIONS.yoe as y}<option>{y}</option>{/each}
                        </select>
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
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Shooter Type</label>
                        <select bind:value={form.shooterType} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                            {#each OPTIONS.shooter as s}<option>{s}</option>{/each}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Intake Type</label>
                        <select bind:value={form.intakeType} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm">
                            {#each OPTIONS.intake as i}<option>{i}</option>{/each}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Weight (lbs)</label>
                        <input type="number" bind:value={form.weightLbs} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Fuel Per Second</label>
                        <input type="text" bind:value={form.fuelPerSecond} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm" />
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
                                    <input type="checkbox" checked={form.autoFeatures.includes(feature.key)} onchange={() => toggleAuto(feature.key)} class="h-4 w-4 text-blue-600 border-gray-300 rounded" />
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
                        <label class="block text-sm font-medium text-gray-700">Known Issues</label>
                        <textarea bind:value={form.knownIssues} rows="2" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">General Comments</label>
                        <textarea bind:value={form.comments} rows="3" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm"></textarea>
                    </div>
                </div>
            </section>

            <div class="flex items-center justify-end space-x-4 pt-4">
                <button
                    type="button"
                    onclick={() => form = createEmptyForm()}
                    disabled={submitting}
                    class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    Clear Form
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    class="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400">
                    {submitting ? 'Saving...' : 'Save Report'}
                </button>
            </div>
        </form>
    </div>
</div>
