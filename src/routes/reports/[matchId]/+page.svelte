<script lang="ts">
    import { enhance } from '$app/forms';
    import { matchFullLabel } from '$lib/matchUtils';

    let { data } = $props();

    const m = $derived(data.match);
    const reports = $derived(data.reports ?? []);

    // Build a map of teamNumber → report for quick lookup
    const reportByTeam = $derived(
        new Map(reports.map((r) => [r.teamNumber, r]))
    );

    // Resolve alliance slots from schedule or from report data
    const redSlots = $derived.by((): (number | null)[] => {
        if (m?.red1 || m?.red2 || m?.red3) return [m.red1, m.red2, m.red3];
        // Fall back: teams that reported Red alliance (0)
        return reports.filter((r) => r.data?.alliance === 0).map((r) => r.teamNumber);
    });

    const blueSlots = $derived.by((): (number | null)[] => {
        if (m?.blue1 || m?.blue2 || m?.blue3) return [m.blue1, m.blue2, m.blue3];
        return reports.filter((r) => r.data?.alliance === 1).map((r) => r.teamNumber);
    });

    const matchLabel = $derived(m ? matchFullLabel(m) : data.matchId);

    const reportCount = $derived(reports.length);

    function climbLabel(v: number | undefined) {
        return ['None', 'L1', 'L2', 'L3'][v ?? 0] ?? 'None';
    }
    function cardLabel(v: number | undefined) {
        return ['None', 'Yellow', 'Red'][v ?? 0] ?? 'None';
    }
    function posLabel(v: number | undefined) {
        return ['L Trench', 'L Bump', 'Center', 'R Bump', 'R Trench'][v ?? 2] ?? '—';
    }
    function yn(v: boolean | undefined) {
        return v ? '✓' : '✗';
    }
</script>

<div class="mx-auto max-w-5xl px-3 py-5">
    <!-- Header -->
    <div class="mb-5">
        <a href="/reports" class="text-sm text-blue-600 hover:underline">← All Reports</a>
        <div class="mt-1 flex flex-wrap items-baseline gap-3">
            <h1 class="text-2xl font-black text-gray-900">{matchLabel}</h1>
            <a
                href="/matches?match={m?.id ?? data.matchId}"
                class="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
            >
                Match Analysis <span class="text-blue-400">↗</span>
            </a>
        </div>
    </div>

    <!-- Red Alliance -->
    <div class="mb-4">
        <p class="mb-2 text-xs font-bold tracking-widest text-red-500 uppercase">Red Alliance</p>
        <div class="grid grid-cols-3 gap-2">
            {#each [redSlots[0], redSlots[1], redSlots[2]] as teamNum}
                {@const report = teamNum != null ? reportByTeam.get(teamNum) : undefined}
                <div class="overflow-hidden rounded-xl border bg-white shadow-sm
                    {report ? 'border-red-200' : 'border-gray-200'}">
                    <!-- Team header -->
                    <div class="border-b px-2 py-2 text-center
                        {report ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'}">
                        {#if teamNum != null}
                            <a href="/teams/{teamNum}"
                               class="block text-base font-black leading-tight hover:underline
                                   {report ? 'text-red-700' : 'text-gray-400'}">
                                {teamNum}
                            </a>
                            {#if report}
                                <p class="truncate text-[10px] text-gray-400">{report.scouterName}</p>
                            {:else}
                                <p class="text-[10px] text-gray-400 italic">No report</p>
                            {/if}
                        {:else}
                            <span class="text-sm text-gray-300">—</span>
                        {/if}
                    </div>

                    {#if report}
                        <div class="space-y-2 p-2 text-[11px]">
                            <!-- Alliance/position -->
                            <div class="text-gray-500">{posLabel(report.data?.startingPosition)}</div>

                            <!-- Auto -->
                            <div>
                                <p class="font-semibold text-gray-600 uppercase tracking-wide text-[9px] mb-0.5">Auto</p>
                                <div class="grid grid-cols-2 gap-x-1 gap-y-0.5 text-gray-700">
                                    <span>Move</span><span class="font-semibold {report.data?.didLeave ? 'text-green-600' : 'text-gray-400'}">{yn(report.data?.didLeave)}</span>
                                    <span>Climb</span><span class="font-semibold {report.data?.autoClimbed ? 'text-green-600' : 'text-gray-400'}">{yn(report.data?.autoClimbed)}</span>
                                    <span>Scored</span><span class="font-semibold text-blue-600">{report.data?.autoFuel ?? 0}</span>
                                    <span>Missed</span><span class="font-semibold text-red-400">{report.data?.autoFuelMissed ?? 0}</span>
                                </div>
                            </div>

                            <!-- Teleop -->
                            <div>
                                <p class="font-semibold text-gray-600 uppercase tracking-wide text-[9px] mb-0.5">Teleop</p>
                                <div class="grid grid-cols-2 gap-x-1 gap-y-0.5 text-gray-700">
                                    <span>Fuel</span><span class="font-semibold {report.data?.teleDidScore ? '' : 'text-gray-400'}">{report.data?.teleDidScore ? `${report.data?.teleFuelScore}/5` : '—'}</span>
                                    <span>Pass</span><span class="font-semibold {report.data?.teleDidPass ? '' : 'text-gray-400'}">{report.data?.teleDidPass ? `${report.data?.telePassScore}/5` : '—'}</span>
                                    <span>Def</span><span class="font-semibold {report.data?.teleDidDef ? '' : 'text-gray-400'}">{report.data?.teleDidDef ? `${report.data?.teleDefScore}/5` : '—'}</span>
                                    {#if report.data?.teleUsesRamp}<span>Ramp</span><span class="font-semibold text-green-600">✓</span>{/if}
                                    {#if report.data?.teleUsesTrench}<span>Trench</span><span class="font-semibold text-green-600">✓</span>{/if}
                                </div>
                            </div>

                            <!-- Endgame -->
                            <div>
                                <p class="font-semibold text-gray-600 uppercase tracking-wide text-[9px] mb-0.5">Endgame</p>
                                <div class="grid grid-cols-2 gap-x-1 gap-y-0.5 text-gray-700">
                                    <span>Climb</span><span class="font-semibold">{climbLabel(report.data?.climbType)}</span>
                                    {#if (report.data?.cardReceived ?? 0) > 0}
                                        <span>Card</span><span class="font-semibold text-yellow-600">{cardLabel(report.data?.cardReceived)}</span>
                                    {/if}
                                </div>
                            </div>

                            <!-- Notes -->
                            {#if report.data?.notes}
                                <p class="text-gray-500 italic leading-snug">{report.data.notes}</p>
                            {/if}

                            <!-- Admin delete -->
                            {#if data.isAdmin}
                                <form method="POST" action="?/deleteReport" use:enhance class="pt-1">
                                    <input type="hidden" name="id" value={report.id} />
                                    <button type="submit"
                                        class="w-full rounded bg-red-50 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-100">
                                        Delete
                                    </button>
                                </form>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    <!-- Blue Alliance -->
    <div>
        <p class="mb-2 text-xs font-bold tracking-widest text-blue-500 uppercase">Blue Alliance</p>
        <div class="grid grid-cols-3 gap-2">
            {#each [blueSlots[0], blueSlots[1], blueSlots[2]] as teamNum}
                {@const report = teamNum != null ? reportByTeam.get(teamNum) : undefined}
                <div class="overflow-hidden rounded-xl border bg-white shadow-sm
                    {report ? 'border-blue-200' : 'border-gray-200'}">
                    <div class="border-b px-2 py-2 text-center
                        {report ? 'border-blue-100 bg-blue-50' : 'border-gray-100 bg-gray-50'}">
                        {#if teamNum != null}
                            <a href="/teams/{teamNum}"
                               class="block text-base font-black leading-tight hover:underline
                                   {report ? 'text-blue-700' : 'text-gray-400'}">
                                {teamNum}
                            </a>
                            {#if report}
                                <p class="truncate text-[10px] text-gray-400">{report.scouterName}</p>
                            {:else}
                                <p class="text-[10px] text-gray-400 italic">No report</p>
                            {/if}
                        {:else}
                            <span class="text-sm text-gray-300">—</span>
                        {/if}
                    </div>

                    {#if report}
                        <div class="space-y-2 p-2 text-[11px]">
                            <div class="text-gray-500">{posLabel(report.data?.startingPosition)}</div>

                            <div>
                                <p class="font-semibold text-gray-600 uppercase tracking-wide text-[9px] mb-0.5">Auto</p>
                                <div class="grid grid-cols-2 gap-x-1 gap-y-0.5 text-gray-700">
                                    <span>Move</span><span class="font-semibold {report.data?.didLeave ? 'text-green-600' : 'text-gray-400'}">{yn(report.data?.didLeave)}</span>
                                    <span>Climb</span><span class="font-semibold {report.data?.autoClimbed ? 'text-green-600' : 'text-gray-400'}">{yn(report.data?.autoClimbed)}</span>
                                    <span>Scored</span><span class="font-semibold text-blue-600">{report.data?.autoFuel ?? 0}</span>
                                    <span>Missed</span><span class="font-semibold text-red-400">{report.data?.autoFuelMissed ?? 0}</span>
                                </div>
                            </div>

                            <div>
                                <p class="font-semibold text-gray-600 uppercase tracking-wide text-[9px] mb-0.5">Teleop</p>
                                <div class="grid grid-cols-2 gap-x-1 gap-y-0.5 text-gray-700">
                                    <span>Scored</span><span class="font-semibold {report.data?.teleDidScore ? 'text-green-600' : 'text-gray-400'}">{report.data?.teleDidScore ? '✓' : '—'}</span>
                                    <span>Fuel</span><span class="font-semibold {report.data?.teleDidScore ? '' : 'text-gray-400'}">{report.data?.teleDidScore ? `${report.data?.teleFuelScore}/5` : '—'}</span>
                                    <span>Pass</span><span class="font-semibold {report.data?.teleDidPass ? '' : 'text-gray-400'}">{report.data?.teleDidPass ? `${report.data?.telePassScore}/5` : '—'}</span>
                                    <span>Def</span><span class="font-semibold {report.data?.teleDidDef ? '' : 'text-gray-400'}">{report.data?.teleDidDef ? `${report.data?.teleDefScore}/5` : '—'}</span>
                                    {#if report.data?.teleUsesRamp}<span>Ramp</span><span class="font-semibold text-green-600">✓</span>{/if}
                                    {#if report.data?.teleUsesTrench}<span>Trench</span><span class="font-semibold text-green-600">✓</span>{/if}
                                </div>
                            </div>

                            <div>
                                <p class="font-semibold text-gray-600 uppercase tracking-wide text-[9px] mb-0.5">Endgame</p>
                                <div class="grid grid-cols-2 gap-x-1 gap-y-0.5 text-gray-700">
                                    <span>Climb</span><span class="font-semibold">{climbLabel(report.data?.climbType)}</span>
                                    {#if (report.data?.cardReceived ?? 0) > 0}
                                        <span>Card</span><span class="font-semibold text-yellow-600">{cardLabel(report.data?.cardReceived)}</span>
                                    {/if}
                                </div>
                            </div>

                            {#if report.data?.notes}
                                <p class="text-gray-500 italic leading-snug">{report.data.notes}</p>
                            {/if}

                            {#if data.isAdmin}
                                <form method="POST" action="?/deleteReport" use:enhance class="pt-1">
                                    <input type="hidden" name="id" value={report.id} />
                                    <button type="submit"
                                        class="w-full rounded bg-red-50 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-100">
                                        Delete
                                    </button>
                                </form>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</div>
