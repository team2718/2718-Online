<script lang="ts">
    // GitHub Copilot
    import { onMount } from 'svelte';

    let autofffs: string[] = [];

    let form = {
        scoutName: '',
        teamNumber: '',
        driverYOE: '', 
        hopperCapacity: '',
        drivetrain: '',
        shooterType: '',
        intakeType: '',
        autoFeatures: autofffs, // checkboxes
        autoStart: '',
        climb: '',
        maxSpeedFtPerS: '',
        weightLbs: '',
        electricalIssues: '',
        comments: ''
    };

    let saved = false;

    const HOPPER_OPTIONS = [
        '0-10',
        '11-20',
        '21-40',
        '41-60',
        '61-80',
        '81+'
    ];

    const DRIVETRAIN_OPTIONS = [
        'Tank',
        'Swerve',
        'Mecanum',
        'Other'
    ];

    const SHOOTER_OPTIONS = [
        'Turret - Single',
        'Turret - Dual',
        'Static - Single',
        'Static - Dual',
        'Static - Triple',
        'Other'
    ];

    const INTAKE_OPTIONS = [
        'Full Width - Over the Bumper',
        'Full Width - Gap in Bumper',
        'Half Width - Over the Bumper',
        'Half Width - Gap in Bumper',
        'Other'
    ];

    const CLIMB_OPTIONS = [
        'No Climb',
        'L1',
        'L2',
        'L3',
    ];

    const DRIVER_YOE_OPTIONS = [
        '0-1 years',
        '2 years',
        '3 years',
        '4+ years',
    ];

    const AUTO_OPTIONS = [
        { key: 'scorePreload', label: 'Score preload' },
        { key: 'intakeMiddle', label: 'Intake middle' },
        { key: 'intakeDepot', label: 'Intake from Depot' },
        { key: 'intakeOutpost', label: 'Intake from Outpost' },
        { key: 'climb', label: 'Climb in Auto' }
    ];

    const AUTO_START_OPTIONS = [
        'Dont care',
        'Depot side under trench',
        'Depot side by ramp',
        'Center',
        'Outpost side by ramp',
        'Outpost side under trench',
    ];

    function toggleAuto(key: string) {
        if (form.autoFeatures.includes(key)) {
            form.autoFeatures = form.autoFeatures.filter(k => k !== key);
        } else {
            form.autoFeatures = [...form.autoFeatures, key];
        }
    }

    function save() {
        const payload = {
            ...form,
            timestamp: new Date().toISOString()
        };
        // Save to localStorage keyed by team or timestamp
        const key = form.teamNumber ? `pit-scout:${form.teamNumber}` : `pit-scout:unsaved:${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(payload, null, 2));
        saved = true;
        setTimeout(() => (saved = false), 2000);
        console.log('Saved payload', payload);
    }

    function downloadJSON() {
        const payload = { ...form, timestamp: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pit-scout-${form.teamNumber || 'unknown'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function clearForm() {
        form = {
            scoutName: '',
            teamNumber: '',
            driverYOE: '',
            hopperCapacity: '',
            drivetrain: '',
            shooterType: '',
            intakeType: '',
            autoFeatures: [],
            autoStart: '',
            climb: '',
            maxSpeedFtPerS: '',
            weightLbs: '',
            electricalIssues: '',
            comments: ''
        };
    }

    onMount(() => {
        // try to prefill last unsaved entry
        const keys = Object.keys(localStorage).filter(k => k.startsWith('pit-scout:'));
        if (keys.length) {
            const last = keys.sort().reverse()[0];
            try {
                const data = JSON.parse(localStorage.getItem(last)!);
                if (data) {
                    // don't overwrite empty form blindly; keep team if present
                    form = { ...form, ...data };
                }
            } catch {}
        }
    });
</script>

<style>
    form {
        max-width: 800px;
        margin: 1rem auto;
        display: grid;
        gap: 0.75rem;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
    }
    .row { display: flex; gap: 0.75rem; }
    @media (max-width: 600px) {
        .row {
            flex-direction: column;
        }
        form {
            max-width: 98vw;
            padding: 0 1vw;
        }
    }
    .field { flex: 1; display:flex; flex-direction:column; }
    label { font-size: 0.9rem; margin-bottom:0.25rem; }
    input, select, textarea { padding:0.5rem; border:1px solid #ccc; border-radius:6px; font-size:0.95rem; }
    input::placeholder, textarea::placeholder {
        color: #888888;
        opacity: 1;
    }
    textarea { min-height:100px; resize:vertical; }
    .checkboxes { display:flex; flex-wrap:wrap; gap:0.5rem; }
    .controls { display:flex; gap:0.5rem; align-items:center; margin-top:0.5rem; }
    button { padding:0.5rem 0.8rem; border-radius:6px; border:1px solid #888; background:#f3f3f3; cursor:pointer; }
    .saved { color: green; font-weight:600; margin-left:0.5rem; }
</style>

<form on:submit|preventDefault={save} aria-label="Pit scouting form for FRC 2026 robot">
    <h1>Pit Scouting Form</h1>
    <div class="row">
        <div class="field">
            <label for="scoutName">Scouter's Name</label>
            <input id="scoutName" type="text" bind:value={form.scoutName} placeholder="e.g. Carter" />
        </div>
    </div>

    <div class="row">
        <div class="field">
            <label for="teamNumber">Team Number</label>
            <input id="teamNumber" type="text" bind:value={form.teamNumber} placeholder="e.g. 254" />
        </div>

        <div class="field">
            <label for="driverYOE">Driver Years of Experience</label>
            <select id="driverYOE" bind:value={form.driverYOE}>
                <option value="" disabled selected>Main Driver's Experience</option>
                {#each DRIVER_YOE_OPTIONS as s}
                    <option value={s}>{s}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="row">
        <div class="field">
            <label for="drivetrain">Drivetrain</label>
            <select id="drivetrain" bind:value={form.drivetrain}>
                <option value="" disabled selected>Select drivetrain</option>
                {#each DRIVETRAIN_OPTIONS as d}
                    <option value={d}>{d}</option>
                {/each}
            </select>
        </div>

        <div class="field">
            <label for="hopper">Number of fuel the robot can hold in its hopper</label>
            <select id="hopper" bind:value={form.hopperCapacity}>
                <option value="" disabled selected>Select capacity</option>
                {#each HOPPER_OPTIONS as opt}
                    <option value={opt}>{opt}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="row">
        <div class="field">
            <label for="shooter">Shooter Type</label>
            <select id="shooter" bind:value={form.shooterType}>
                <option value="" disabled selected>Select shooter</option>
                {#each SHOOTER_OPTIONS as s}
                    <option value={s}>{s}</option>
                {/each}
            </select>
        </div>

        <div class="field">
            <label for="intake">Intake Type</label>
            <select id="intake" bind:value={form.intakeType}>
                <option value="" disabled selected>Select intake</option>
                {#each INTAKE_OPTIONS as opt}
                    <option value={opt}>{opt}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="field">
        <label>Autonomous capabilities (check all that apply)</label>
        <div class="checkboxes" role="group" aria-label="Autonomous capabilities">
            {#each AUTO_OPTIONS as a}
                <label><input type="checkbox" checked={form.autoFeatures.includes(a.key)} on:change={() => toggleAuto(a.key)} /> {a.label}</label>
            {/each}
        </div>
    </div>

    <div class="row">
        <div class="field">
            <label for="autoStart">Auto Start Preference</label>
            <select id="autoStart" bind:value={form.autoStart}>
                <option value="" disabled selected>Auto Start Preference</option>
                {#each AUTO_START_OPTIONS as c}
                    <option value={c}>{c}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="row">
        <div class="field">
            <label for="climb">Max Climb capability</label>
            <select id="climb" bind:value={form.climb}>
                <option value="" disabled selected>Select climb</option>
                {#each CLIMB_OPTIONS as c}
                    <option value={c}>{c}</option>
                {/each}
            </select>
        </div>

        <div class="field">
            <label for="speed">Fuel per second</label>
            <input id="speed" type="number" min="0" step="1.0" bind:value={form.maxSpeedFtPerS} placeholder="e.g. 3" />
        </div>

        <div class="field">
            <label for="weight">Weight (lbs)</label>
            <input id="weight" type="number" min="0" step="5.0" bind:value={form.weightLbs} placeholder="e.g. 115" />
        </div>
    </div>

    <div class="field">
        <label for="electrical">Known issues</label>
        <textarea id="electrical" bind:value={form.electricalIssues} placeholder="List any known issues, weak points, etc."></textarea>
    </div>

    <div class="field">
        <label for="comments">Additional comments / notes</label>
        <textarea id="comments" bind:value={form.comments} placeholder="Anything else the pit crew mentions..."></textarea>
    </div>

    <div class="controls">
        <!-- <button type="submit">Save to local</button>
        <button type="button" on:click={downloadJSON}>Download JSON</button> -->
        <button type="button" on:click={clearForm}>Clear</button>
        {#if saved}
            <span class="saved" role="status">Saved</span>
        {/if}
    </div>
</form>