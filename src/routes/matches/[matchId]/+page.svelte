<script lang="ts">
    import { Heading, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge } from 'flowbite-svelte';
    export let data;

    const getPosLabel = (val: number) => [
        'Left Trench', 'Left Bump', 'Center', 'Right Bump', 'Right Trench'
    ][val] ?? val;

    const getClimbLabel = (val: number) => ['None', 'L1', 'L2', 'L3'][val] ?? 'None';
    
    const getCardLabel = (val: number) => ['None', 'Yellow', 'Red'][val] ?? 'None';
</script>

<div class="p-6 max-w-full mx-auto overflow-x-auto">
    <header class="mb-6">
        <a href="/matches" class="text-blue-600 hover:underline">← All Matches</a>
        <Heading tag="h1" class="mt-2">Reports for Match {data.matchId}</Heading>
    </header>

    <Table hoverable={true} divClass="relative overflow-x-auto shadow-md sm:rounded-lg">
        <TableHead>
            <TableHeadCell>Team</TableHeadCell>
            <TableHeadCell>Scouter</TableHeadCell>
            <TableHeadCell>Info</TableHeadCell>
            <TableHeadCell>Auto Move</TableHeadCell>
            <TableHeadCell>Auto Score</TableHeadCell>
            <TableHeadCell>Teleop (Rate/Acc/Pass/Def)</TableHeadCell>
            <TableHeadCell>Endgame</TableHeadCell>
            <TableHeadCell>Notes</TableHeadCell>
        </TableHead>
        <TableBody>
            {#each data.reports as report}
                <TableBodyRow>
                    <TableBodyCell class="font-bold">{report.teamNumber}</TableBodyCell>
                    <TableBodyCell>{report.scouterName}</TableBodyCell>
                    <TableBodyCell>
                        <div class="flex flex-col gap-1">
                            <Badge color={report.data?.alliance === 0 ? 'red' : 'blue'}>
                                {report.data?.alliance === 0 ? 'Red' : 'Blue'}
                            </Badge>
                            <span class="text-xs text-gray-500">{getPosLabel(report.data?.startingPosition)}</span>
                        </div>
                    </TableBodyCell>
                    <TableBodyCell>
                        Leave: {report.data?.didLeave ? 'Yes' : 'No'}<br/>
                        Climb: {report.data?.autoClimbed ? 'Yes' : 'No'}
                    </TableBodyCell>
                    <TableBodyCell>
                        Scored: {report.data?.autoFuel ?? 0}<br/>
                        Missed: {report.data?.autoFuelMissed ?? 0}
                    </TableBodyCell>
                    <TableBodyCell>
                        {report.data?.teleFuelRateScore} / {report.data?.teleAccScore} / {report.data?.telePassScore} / {report.data?.teleDefScore}
                    </TableBodyCell>
                    <TableBodyCell>
                        Climb: {getClimbLabel(report.data?.climbType)}<br/>
                        Card: {getCardLabel(report.data?.cardReceived)}
                    </TableBodyCell>
                    <TableBodyCell class="max-w-xs whitespace-normal text-xs">
                        {report.data?.notes ?? ''}
                    </TableBodyCell>
                </TableBodyRow>
            {/each}
        </TableBody>
    </Table>
</div>