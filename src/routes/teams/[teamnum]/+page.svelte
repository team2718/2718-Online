<script lang="ts">
    import { Badge, Listgroup, ListgroupItem, Button } from 'flowbite-svelte';
    import { ArrowLeftOutline, ChevronRightOutline } from 'flowbite-svelte-icons';

    let { data } = $props();

    // Use $derived to reactively track changes to data
    const reports = $derived(data?.matchReports ?? []);
    const pitReports = $derived(data?.pitReports ?? []);
    
    // Derive unique match IDs from the match reports
    const matchesPlayed = $derived([...new Set(reports.map(r => r.matchId))].sort());

    // Helper to format camelCase keys from autoFeatures into readable text
    const formatFeature = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1') // Add space before capitals
            .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
    };
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
                        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                            <div class="bg-gray-50 px-6 py-3 border-b flex justify-between items-center text-sm">
                                <span class="font-semibold text-blue-600">
                                    Scouted by {report.data.scoutName || 'Unknown'}
                                </span>
                                <span class="text-gray-500">
                                    {report.data.timestamp ? new Date(report.data.timestamp).toLocaleString() : 'No Date'}
                                </span>
                            </div>
                            
                            <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Drivetrain</p>
                                    <p class="text-gray-900 font-medium">{report.data.drivetrain}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Shooter</p>
                                    <p class="text-gray-900 font-medium">{report.data.shooterType}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Intake</p>
                                    <p class="text-gray-900 font-medium">{report.data.intakeType}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Max Climb</p>
                                    <p class="text-gray-900 font-medium">{report.data.climb}</p>
                                </div>

                                <div>
                                    <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Weight</p>
                                    <p class="text-gray-900 font-medium">{report.data.weightLbs || '??'} lbs</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Fuel / Sec</p>
                                    <p class="text-gray-900 font-medium">{report.data.fuelPerSecond || 'N/A'}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Hopper</p>
                                    <p class="text-gray-900 font-medium">{report.data.hopperCapacity}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Driver Exp</p>
                                    <p class="text-gray-900 font-medium">{report.data.driverYOE}</p>
                                </div>
                                
                                <div class="col-span-2 md:col-span-4 border-t border-gray-100 pt-4">
                                    <p class="text-xs text-gray-400 uppercase font-bold tracking-wider mb-3">Autonomous Capabilities</p>
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

                                <div class="col-span-2 md:col-span-4 grid md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                                    <div class="bg-red-50 p-4 rounded-lg border border-red-100">
                                        <p class="text-xs text-red-700 uppercase font-bold tracking-wider">Weak Points / Issues</p>
                                        <p class="text-gray-700 mt-1 text-sm italic">
                                            {report.data.knownIssues || 'No known issues reported.'}
                                        </p>
                                    </div>
                                    <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <p class="text-xs text-blue-700 uppercase font-bold tracking-wider">Scouter Comments</p>
                                        <p class="text-gray-700 mt-1 text-sm italic">
                                            {report.data.comments || 'No additional comments.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <div class="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
                        <p class="text-gray-400 mb-4">No pit data available for this team yet.</p>
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
                            <div class="p-8 text-center text-gray-400 text-sm italic">No match reports recorded.</div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>