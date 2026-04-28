<script lang="ts">
	import { Badge, Button } from 'flowbite-svelte';
	import { ArrowLeftOutline, ChevronRightOutline, TrashBinSolid } from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';
	import { playoffKey } from '$lib/matchUtils';
	import { page } from '$app/state';

	let { data } = $props();

	const fromAllianceSelection = $derived(page.url.searchParams.get('from') === 'alliance-selection');

	// Use $derived to reactively track changes to data
	const reports = $derived(data?.matchReports ?? []);
	const pitReports = $derived(data?.pitReports ?? []);
	const canGoUnderTrench = $derived(pitReports.at(-1)?.data?.canGoUnderTrench ?? null);

	// Calculate average statistics for match reports
	const avgStats = $derived.by(() => {
		if (!reports || reports.length === 0) return null;

		// Deduplicate by matchId: for each match with multiple reports, produce one
		// effective report by averaging numeric fields and majority-voting booleans.
		const byMatch = new Map<string, typeof reports>();
		for (const r of reports) {
			if (!byMatch.has(r.matchId)) byMatch.set(r.matchId, []);
			byMatch.get(r.matchId)!.push(r);
		}
		const deduped = [...byMatch.values()].map((group) => {
			if (group.length === 1) return group[0];
			const n = group.length;
			const avg = (fn: (d: typeof group[0]['data']) => number) =>
				group.reduce((s, r) => s + fn(r.data), 0) / n;
			const majority = (fn: (d: typeof group[0]['data']) => boolean) =>
				group.filter((r) => fn(r.data)).length >= n / 2;
			const d0 = group[0].data;
			return {
				...group[0],
				data: {
					...d0,
					autoFuel: avg((d) => Number(d?.autoFuel) || 0),
					autoFuelMissed: avg((d) => Number(d?.autoFuelMissed) || 0),
					teleFuelScore: avg((d) => Number(d?.teleFuelScore) || 0),
					telePassScore: avg((d) => Number(d?.telePassScore) || 0),
					teleDefScore: avg((d) => Number(d?.teleDefScore) || 0),
					didLeave: majority((d) => !!d?.didLeave),
					autoClimbed: majority((d) => !!d?.autoClimbed),
					teleDidPass: majority((d) => !!d?.teleDidPass),
					teleDidDef: majority((d) => !!d?.teleDidDef),
				}
			};
		});

		const count = deduped.length;
		const sum = deduped.reduce(
			(acc, curr) => {
				const d = curr.data;
				const didPass = !!d?.teleDidPass;
				const didDef = !!d?.teleDidDef;
				return {
					autoFuel: acc.autoFuel + (Number(d?.autoFuel) || 0),
					autoFuelMissed: acc.autoFuelMissed + (Number(d?.autoFuelMissed) || 0),
				teleFuelScore: acc.teleFuelScore + (Number(d?.teleFuelScore) || 0),
					passCount: acc.passCount + (didPass ? 1 : 0),
					telePassScore: acc.telePassScore + (didPass ? (Number(d?.telePassScore) || 0) : 0),
					defCount: acc.defCount + (didDef ? 1 : 0),
					teleDefScore: acc.teleDefScore + (didDef ? (Number(d?.teleDefScore) || 0) : 0),
					didLeave: acc.didLeave + (d?.didLeave ? 1 : 0),
					autoClimbed: acc.autoClimbed + (d?.autoClimbed ? 1 : 0),
					climbL1: acc.climbL1 + (d?.climbType === 1 ? 1 : 0),
					climbL2: acc.climbL2 + (d?.climbType === 2 ? 1 : 0),
					climbL3: acc.climbL3 + (d?.climbType === 3 ? 1 : 0)
				};
			},
			{
				autoFuel: 0,
				autoFuelMissed: 0,
				teleFuelScore: 0,
				passCount: 0,
				telePassScore: 0,
				defCount: 0,
				teleDefScore: 0,
				didLeave: 0,
				autoClimbed: 0,
				climbL1: 0,
				climbL2: 0,
				climbL3: 0
			}
		);

		return {
			autoFuel: (sum.autoFuel / count).toFixed(1),
			autoFuelMissed: (sum.autoFuelMissed / count).toFixed(1),
			teleFuelScore: (sum.teleFuelScore / count).toFixed(1),
			telePassScore: sum.passCount > 0 ? (sum.telePassScore / sum.passCount).toFixed(1) : null,
			passPercent: Math.round((sum.passCount / count) * 100),
			teleDefScore: sum.defCount > 0 ? (sum.teleDefScore / sum.defCount).toFixed(1) : null,
			defPercent: Math.round((sum.defCount / count) * 100),
			didLeavePercent: Math.round((sum.didLeave / count) * 100),
			autoClimbedPercent: Math.round((sum.autoClimbed / count) * 100),
			climbL1Pct: Math.round((sum.climbL1 / count) * 100),
			climbL2Pct: Math.round((sum.climbL2 / count) * 100),
			climbL3Pct: Math.round((sum.climbL3 / count) * 100),
			reportCount: count
		};
	});

	// Helper to format camelCase keys from autoFeatures into readable text
	const formatFeature = (key: string) => {
		return key
			.replace(/([A-Z])/g, ' $1') // Add space before capitals
			.replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
	};

	const reportsSorted = $derived(
		[...reports].sort((a, b) => a.matchId.localeCompare(b.matchId, undefined, { numeric: true }))
	);

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
	function sparkX(m: number, minM: number, maxM: number, leftPad: number, chartWidth: number) {
		return leftPad + ((m - minM) / Math.max(maxM - minM, 1)) * chartWidth;
	}
	function sparkY(v: number, rawMin: number, rawMax: number, vPad: number, topPad: number, chartHeight: number) {
		return topPad + (1 - (v - (rawMin - vPad)) / Math.max(rawMax - rawMin + 2 * vPad, 1)) * chartHeight;
	}

	const sortedTeamMatches = $derived.by(() => {
		const nonPlayoff = data.teamMatches.filter((m) => m.matchType !== 'playoff');
		const playoff = data.teamMatches
			.filter((m) => m.matchType === 'playoff')
			.sort((a, b) => playoffKey(a.id) - playoffKey(b.id));
		return [...nonPlayoff, ...playoff];
	});
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-7xl px-4 py-8">
		<div class="mb-8 flex items-start gap-4">
			{#if fromAllianceSelection}
				<Button href="/alliance-selection" color="green" pill size="sm" class="mt-1 shrink-0">
					<ArrowLeftOutline class="mr-2 h-4 w-4" /> Alliance Selection
				</Button>
			{:else}
				<Button href="/teams" color="light" pill size="sm" class="mt-1 shrink-0">
					<ArrowLeftOutline class="mr-2 h-4 w-4" /> Teams
				</Button>
			{/if}
			<div>
				<h1 class="text-4xl font-black tracking-tight text-gray-900">Team {data.teamnum}</h1>
				{#if data.team}
					<p class="mt-1 text-lg font-semibold text-gray-600">{data.team.name}</p>
					{#if (data.team.metadata as Record<string, unknown>)?.state_prov}
						<p class="mt-0.5 text-sm text-gray-400">
							{[(data.team.metadata as Record<string, unknown>)?.city, (data.team.metadata as Record<string, unknown>)?.state_prov, (data.team.metadata as Record<string, unknown>)?.country].filter(Boolean).join(', ')}
						</p>
					{/if}
				{/if}
			</div>
		</div>

		{#if data.epop != null}
			<div class="mb-6">
				<div class="mb-2 flex items-center gap-2">
					<span class="text-xs font-semibold tracking-wider text-gray-400 uppercase">ePOP</span>
					<a
						href="https://www.thebluealliance.com/team/{data.teamnum}"
						target="_blank"
						rel="noopener noreferrer"
						class="text-xs text-blue-400 transition-colors hover:text-blue-600"
					>thebluealliance.com ↗</a>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-center">
						<p class="text-2xl font-black text-purple-700">{data.epop.toFixed(1)}</p>
						<p class="text-xs font-semibold tracking-wider text-purple-400 uppercase">ePOP</p>
					</div>
					{#if data.epopHistory && data.epopHistory.length >= 2}
						{@const pts = data.epopHistory}
						{@const W = 300}
						{@const H = 48}
						{@const PAD = {t:4,b:4,l:4,r:4}}
						{@const cW = W - PAD.l - PAD.r}
						{@const cH = H - PAD.t - PAD.b}
						{@const minM = pts[0].matchNumber}
						{@const maxM = pts[pts.length - 1].matchNumber}
						{@const rawMin = Math.min(...pts.map(p => p.epop))}
						{@const rawMax = Math.max(...pts.map(p => p.epop))}
						{@const vPad = Math.max((rawMax - rawMin) * 0.15, 2)}
						{@const xp = (m: number) => sparkX(m, minM, maxM, PAD.l, cW)}
						{@const yp = (v: number) => sparkY(v, rawMin, rawMax, vPad, PAD.t, cH)}
						{@const polyPts = pts.map(p => `${xp(p.matchNumber).toFixed(1)},${yp(p.epop).toFixed(1)}`).join(' ')}
						<div class="rounded-lg border border-purple-100 bg-white px-2 py-2">
							<svg viewBox="0 0 {W} {H}" class="w-full" style="height:40px">
								<polyline points={polyPts} fill="none" stroke="#7c3aed" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />
								{#each pts as p}
									<circle cx={xp(p.matchNumber).toFixed(1)} cy={yp(p.epop).toFixed(1)} r="2" fill="#7c3aed" />
								{/each}
							</svg>
							<p class="mt-0.5 text-center text-xs font-semibold tracking-wider text-purple-300 uppercase">ePOP Trend</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}


		<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		<div class="space-y-6 lg:col-span-8">
			<div>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-800">Team Statistics</h2>
					{#if avgStats}
						<Badge color="green">{avgStats.reportCount} Matches</Badge>
					{/if}
				</div>

				{#if avgStats}
					<div
						class="mb-8 grid grid-cols-2 gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-4"
					>
						<div>
							<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
								Fuel Rating
							</p>
							<p class="text-2xl font-bold text-gray-900">
								{avgStats.teleFuelScore}<span class="text-sm font-normal text-gray-500">
									/ 5</span
								>
							</p>
						</div>
						<div>
							<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
								Passing Rating
							</p>
							{#if avgStats.telePassScore !== null}
								<p class="text-2xl font-bold text-gray-900">
									{avgStats.telePassScore}<span class="text-sm font-normal text-gray-500"> / 5</span>
								</p>
								<p class="text-xs text-gray-400">{avgStats.passPercent}% of matches</p>
							{:else}
								<p class="text-2xl font-bold text-gray-400">—</p>
								<p class="text-xs text-gray-400">Never passed</p>
							{/if}
						</div>
						<div>
							<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
								Defense Rating
							</p>
							{#if avgStats.teleDefScore !== null}
								<p class="text-2xl font-bold text-gray-900">
									{avgStats.teleDefScore}<span class="text-sm font-normal text-gray-500"> / 5</span>
								</p>
								<p class="text-xs text-gray-400">{avgStats.defPercent}% of matches</p>
							{:else}
								<p class="text-2xl font-bold text-gray-400">—</p>
								<p class="text-xs text-gray-400">Never defended</p>
							{/if}
						</div>
						<div>
							<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
								Auto Fuel Made / Missed
							</p>
							<p class="text-2xl font-bold text-gray-900">{avgStats.autoFuel} / {avgStats.autoFuelMissed}</p>
						</div>
						<div>
							<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Climb Ability</p>
							<div class="mt-1 space-y-0.5 text-sm">
								<p class="font-semibold {avgStats.climbL1Pct > 0 ? 'text-gray-900' : 'text-gray-300'}">L1: {avgStats.climbL1Pct}%</p>
								<p class="font-semibold {avgStats.climbL2Pct > 0 ? 'text-gray-900' : 'text-gray-300'}">L2: {avgStats.climbL2Pct}%</p>
								<p class="font-semibold {avgStats.climbL3Pct > 0 ? 'text-gray-900' : 'text-gray-300'}">L3: {avgStats.climbL3Pct}%</p>
							</div>
						</div>
						<div>
							<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Auto Climb</p>
							<p class="text-2xl font-bold text-gray-900">{avgStats.autoClimbedPercent}%</p>
						</div>
						<div>
							<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Under Trench</p>
							<p class="text-2xl font-bold text-gray-900">
								{canGoUnderTrench === true ? 'Yes' : canGoUnderTrench === false ? 'No' : '—'}
							</p>
						</div>
						<div>
							<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">
								Moved in Auto
							</p>
							<p class="text-2xl font-bold text-gray-900">{avgStats.didLeavePercent}%</p>
						</div>
					</div>
				{:else if canGoUnderTrench !== null}
					<div class="mb-8 grid grid-cols-2 gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-4">
						<div>
							<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Under Trench</p>
							<p class="text-2xl font-bold text-gray-900">
								{canGoUnderTrench === true ? 'Yes' : 'No'}
							</p>
						</div>
					</div>
				{:else}
					<div
						class="mb-8 rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center"
					>
						<p class="text-gray-400">No scouting data available yet.</p>
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-800">Match Reports</h2>
				<Badge color="gray">{reports.length} Report{reports.length !== 1 ? 's' : ''}</Badge>
			</div>

			{#if reportsSorted.length > 0}
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each reportsSorted as report}
						<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
							<div class="border-b border-gray-100 bg-gray-50 px-3 py-2 text-center">
								<a href="/matches?match={report.matchId}" class="block text-sm font-black text-gray-700 hover:underline">{report.matchId}</a>
								<p class="truncate text-[10px] text-gray-400">{report.scouterName}</p>
							</div>
							<div class="space-y-2 p-2 text-[11px]">
								<div class="text-gray-500">{posLabel(report.data?.startingPosition)}</div>

								<div>
									<p class="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-600">Auto</p>
									<div class="grid grid-cols-2 gap-x-1 gap-y-0.5 text-gray-700">
										<span>Move</span><span class="font-semibold {report.data?.didLeave ? 'text-green-600' : 'text-gray-400'}">{yn(report.data?.didLeave)}</span>
										<span>Climb</span><span class="font-semibold {report.data?.autoClimbed ? 'text-green-600' : 'text-gray-400'}">{yn(report.data?.autoClimbed)}</span>
										<span>Scored</span><span class="font-semibold text-blue-600">{report.data?.autoFuel ?? 0}</span>
										<span>Missed</span><span class="font-semibold text-red-400">{report.data?.autoFuelMissed ?? 0}</span>
									</div>
								</div>

								<div>
									<p class="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-600">Teleop</p>
									<div class="grid grid-cols-2 gap-x-1 gap-y-0.5 text-gray-700">
										<span>Fuel</span><span class="font-semibold {report.data?.teleFuelScoredAny ? '' : 'text-gray-400'}">{report.data?.teleFuelScoredAny ? `${report.data?.teleFuelScore}/5` : '—'}</span>
										<span>Pass</span><span class="font-semibold {report.data?.teleDidPass ? '' : 'text-gray-400'}">{report.data?.teleDidPass ? `${report.data?.telePassScore}/5` : '—'}</span>
										<span>Def</span><span class="font-semibold {report.data?.teleDidDef ? '' : 'text-gray-400'}">{report.data?.teleDidDef ? `${report.data?.teleDefScore}/5` : '—'}</span>
									</div>
								</div>

								<div>
									<p class="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-600">Endgame</p>
									<div class="grid grid-cols-2 gap-x-1 gap-y-0.5 text-gray-700">
										<span>Climb</span><span class="font-semibold">{climbLabel(report.data?.climbType)}</span>
										{#if (report.data?.cardReceived ?? 0) > 0}
											<span>Card</span><span class="font-semibold text-yellow-600">{cardLabel(report.data?.cardReceived)}</span>
										{/if}
									</div>
								</div>

								{#if (data.isAdmin || data.isPrivileged) && report.data?.notes}
									<p class="italic leading-snug text-gray-500">{report.data.notes}</p>
								{/if}

								{#if data.isAdmin}
									<form method="POST" action="?/deleteReport" use:enhance class="pt-1">
										<input type="hidden" name="id" value={report.id} />
										<button type="submit" class="w-full rounded bg-red-50 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-100">Delete</button>
									</form>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
					<p class="text-gray-400">No match reports recorded yet.</p>
				</div>
			{/if}

			<div class="flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-800">Pit Reports</h2>
				<Badge color="blue">{pitReports.length} Reports</Badge>
			</div>

			{#if pitReports.length > 0}
				{#each pitReports as report}
					<div class="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
						<div class="flex items-center justify-between border-b bg-gray-50 px-6 py-3 text-sm">
							<div>
								{#if report.data}
									{@const pitData = report.data}
									<span class="font-semibold text-blue-600">
										Scouted by {pitData.scoutName || 'Unknown'}
									</span>
									<span class="ml-2 text-gray-500">
										{pitData.timestamp
											? new Date(pitData.timestamp).toLocaleString()
											: 'No Date'}
									</span>
								{:else}
									<span class="font-semibold text-blue-600">Pit report</span>
									<span class="ml-2 text-gray-500">No structured data</span>
								{/if}
							</div>

							{#if data.isAdmin}
								<form method="POST" action="?/deletePitReport" use:enhance>
									<input type="hidden" name="id" value={report.id} />
									<Button
										type="submit"
										color="red"
										size="xs"
										class="p-1.5!"
										title="Delete Pit Report"
									>
										<TrashBinSolid class="h-4 w-4" />
									</Button>
								</form>
							{/if}
						</div>

						{#if report.data}
							{@const pitData = report.data}
							<div class="grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Drivetrain</p>
									<p class="font-medium text-gray-900">{pitData.drivetrain}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Shooter</p>
									<p class="font-medium text-gray-900">{pitData.shooterType}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Intake</p>
									<p class="font-medium text-gray-900">{pitData.intakeType}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Max Climb</p>
									<p class="font-medium text-gray-900">{pitData.climb}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Under Trench</p>
									<p class="font-medium text-gray-900">
										{pitData.canGoUnderTrench === true ? 'Yes' : pitData.canGoUnderTrench === false ? 'No' : '—'}
									</p>
								</div>

								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Weight</p>
									<p class="font-medium text-gray-900">{pitData.weightLbs || '??'} lbs</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Fuel / Sec</p>
									<p class="font-medium text-gray-900">{pitData.fuelPerSecond || 'N/A'}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Hopper</p>
									<p class="font-medium text-gray-900">{pitData.hopperCapacity}</p>
								</div>
								<div>
									<p class="text-xs font-bold tracking-wider text-gray-400 uppercase">Driver Exp</p>
									<p class="font-medium text-gray-900">{pitData.driverYOE}</p>
								</div>

								<div class="col-span-2 border-t border-gray-100 pt-4 md:col-span-4">
									<p class="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
										Autonomous Capabilities
									</p>
									<div class="space-y-3">
										<div class="text-sm">
											<span class="text-gray-500 italic">Preferred Start:</span>
											<span class="ml-2 font-semibold text-gray-800">{pitData.autoStart}</span>
										</div>
										<div class="flex flex-wrap gap-2">
											{#if pitData.autoFeatures?.length > 0}
												{#each pitData.autoFeatures as feature}
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

								{#if data.isAdmin || data.isPrivileged}
									<div
										class="col-span-2 grid gap-4 border-t border-gray-100 pt-4 md:col-span-4 md:grid-cols-2"
									>
										<div class="rounded-lg border border-red-100 bg-red-50 p-4">
											<p class="text-xs font-bold tracking-wider text-red-700 uppercase">
												Known Issues
											</p>
											<p class="mt-1 text-sm text-gray-700 italic">
												{pitData.knownIssues || 'No known issues reported.'}
											</p>
										</div>
										<div class="rounded-lg border border-blue-100 bg-blue-50 p-4">
											<p class="text-xs font-bold tracking-wider text-blue-700 uppercase">
												General Comments
											</p>
											<p class="mt-1 text-sm text-gray-700 italic">
												{pitData.comments || 'No additional comments.'}
											</p>
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<div class="p-6 text-sm text-gray-500">This pit report does not contain structured pit data.</div>
						{/if}
					</div>
				{/each}
			{:else}
				<div class="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
					<p class="mb-4 text-gray-400">No pit data available for this team yet.</p>
				</div>
			{/if}
		</div>

		<div class="lg:col-span-4">
			<div class="top-8">
				<h2 class="mb-4 text-xl font-bold text-gray-800">Match History</h2>
				<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
					<!-- Header row -->
					<div class="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-1.5">
						<span class="w-16 shrink-0 text-[10px] font-bold tracking-wider text-gray-400 uppercase">Match</span>
						<span class="flex-1 text-center text-[10px] font-bold tracking-wider text-gray-400 uppercase">Score</span>
						<span class="w-10 shrink-0 text-center text-[10px] font-bold tracking-wider text-gray-400 uppercase">Actual</span>
						{#if data.hasEpopData}
							<span class="w-10 shrink-0 text-center text-[10px] font-bold tracking-wider text-purple-400 uppercase">Pred</span>
						{/if}
						<span class="w-3.5 shrink-0"></span>
					</div>
					{#each sortedTeamMatches as match}
						{@const onRed = [match.red1, match.red2, match.red3].includes(data.teamnum)}
						{@const myScore = onRed ? match.redScore : match.blueScore}
						{@const theirScore = onRed ? match.blueScore : match.redScore}
						{@const isWin = myScore != null && theirScore != null && myScore > theirScore}
						{@const isLoss = myScore != null && theirScore != null && myScore < theirScore}
						{@const predProb = data.matchPredictions[match.id] ?? 0.5}
						{@const isPredWin = predProb > 0.51}
						{@const isPredLoss = predProb < 0.49}
						<a
							href="/matches?match={match.id}"
							class="group flex items-center gap-2 border-b border-gray-100 px-3 py-2.5 last:border-0 transition-colors hover:bg-blue-50"
						>
							<span class="w-16 shrink-0 font-mono text-xs font-semibold text-gray-600">{match.id}</span>
							{#if myScore != null && theirScore != null}
								<span class="flex-1 text-center font-mono text-sm">
									<span class="{onRed ? 'text-red-700' : 'text-blue-700'} font-black">{myScore}</span>
									<span class="mx-1 text-gray-300">–</span>
									<span class="{!onRed ? 'text-red-700' : 'text-blue-700'} font-normal">{theirScore}</span>
								</span>
								<span class="w-10 shrink-0 text-center text-xs font-bold {isWin ? 'text-green-600' : isLoss ? 'text-red-500' : 'text-gray-400'}">
									{isWin ? 'W' : isLoss ? 'L' : 'T'}
								</span>
							{:else}
								<span class="flex-1 text-center text-xs italic text-gray-400">unscored</span>
								<span class="w-10 shrink-0"></span>
							{/if}
							{#if data.hasEpopData}
								<span class="w-10 shrink-0 text-center text-xs font-bold {isPredWin ? 'text-green-500' : isPredLoss ? 'text-red-400' : 'text-gray-400'}">
									{isPredWin ? 'W' : isPredLoss ? 'L' : 'T'}
								</span>
							{/if}
							<ChevronRightOutline class="h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:text-blue-400" />
						</a>
					{/each}
					{#if data.teamMatches.length === 0}
						<div class="p-8 text-center text-sm italic text-gray-400">
							No matches in schedule for this team.
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
	</div>
</div>
