<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Html5Qrcode } from 'html5-qrcode';

	let { data } = $props();

	let scanner: Html5Qrcode;
	let notification: { message: string; type: 'success' | 'error' | 'warning' } | null =
		$state(null);

	type ScanRecord = {
		id: string;
		time: string;
		preview: string;
		status: 'saved' | 'duplicate';
	};

	let recentScans = $state<ScanRecord[]>([]);

	const triggerHaptic = (pattern: number | number[] = 100) => {
		try {
			if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
				navigator.vibrate(pattern);
			}
		} catch {
			/* ignore if unsupported */
		}
	};

	const showNotification = (
		message: string,
		type: 'success' | 'error' | 'warning',
		shouldPause: boolean
	) => {
		notification = { message, type };

		if (type === 'success') {
			triggerHaptic([60, 40, 60]);
		} else if (type === 'warning') {
			triggerHaptic(150);
		} else {
			triggerHaptic([100, 50, 100]);
		}

		if (shouldPause) {
			scanner.pause(true);
		}

		setTimeout(() => {
			notification = null;
			if (shouldPause) {
				scanner.resume();
			}
		}, 1500);
	};

	onMount(() => {
		// Load recent scans from session storage
		try {
			const cached = sessionStorage.getItem('2718_recent_scans');
			if (cached) recentScans = JSON.parse(cached);
		} catch {
			/* ignore */
		}

		scanner = new Html5Qrcode('reader');

		scanner.start(
			{ facingMode: 'environment' },
			{ fps: 10, qrbox: { width: 250, height: 250 } },
			async (decodedText: string) => {
				if (notification && (notification.type === 'success' || notification.type === 'warning'))
					return;

				try {
					const formData = new FormData();
					formData.append('report', decodedText);

					const response = await fetch('?/submitScan', {
						method: 'POST',
						body: formData
					});

					const result = await response.json();

					if (result.type === 'failure') {
						if (result.status === 409) {
							showNotification('Duplicate: Already scanned!', 'warning', true);
							addRecentScan(decodedText, 'duplicate');
						} else {
							const actionData = JSON.parse(result.data)[0];
							showNotification(actionData?.message || 'Scan failed.', 'error', false);
						}
						return;
					}

					showNotification('Saved', 'success', true);
					addRecentScan(decodedText, 'saved');
				} catch {
					showNotification('Error: Invalid QR data.', 'error', false);
				}
			},
			() => {}
		);

		return () => scanner.stop();
	});

	function addRecentScan(rawText: string, status: 'saved' | 'duplicate') {
		const newRecord: ScanRecord = {
			id: Math.random().toString(36).slice(2),
			time: new Date().toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			}),
			preview: rawText.length > 35 ? rawText.slice(0, 35) + '…' : rawText,
			status
		};

		recentScans = [newRecord, ...recentScans.slice(0, 4)];
		try {
			sessionStorage.setItem('2718_recent_scans', JSON.stringify(recentScans));
		} catch {
			/* ignore */
		}
	}
</script>

<div class="mx-auto max-w-md space-y-4 px-4 py-4 sm:py-6">
	<!-- Top Mode & Header -->
	<div
		class="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800/80"
	>
		<div>
			<h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">QR Scanner</h1>
			<p class="text-xs text-slate-500 dark:text-slate-400">Scan match reports from tablets</p>
		</div>

		<a
			href={resolve('/admin')}
			title="Change in Admin settings"
			class="rounded-full px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide uppercase
				{data.matchType === 'practice'
				? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
				: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}"
		>
			{data.matchType === 'practice' ? 'Practice' : 'Qual'} Mode
		</a>
	</div>

	<!-- Camera Viewport -->
	<div
		class="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-lg dark:border-slate-800/80"
	>
		<div id="reader" class="w-full"></div>
	</div>

	<!-- Scanner Instructions -->
	<div
		class="rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center dark:border-slate-800/80 dark:bg-slate-900"
	>
		<p class="text-xs font-semibold text-slate-700 dark:text-slate-300">
			Point camera at scouter's tablet QR code
		</p>
		<p class="mt-0.5 text-[11px] text-slate-400">
			Scans trigger haptic feedback and save automatically
		</p>
	</div>

	<!-- Recent Scans History Reel -->
	{#if recentScans.length > 0}
		<div
			class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900"
		>
			<div
				class="flex items-center justify-between border-b border-slate-100 bg-slate-50/75 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/50"
			>
				<span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
					>Recent Scans</span
				>
				<span class="font-mono text-[10px] text-slate-400">{recentScans.length} logged</span>
			</div>
			<div class="divide-y divide-slate-100 dark:divide-slate-800">
				{#each recentScans as scan (scan.id)}
					<div class="flex items-center justify-between px-4 py-2 text-xs">
						<div class="flex items-center gap-2">
							<span
								class="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold
								{scan.status === 'saved'
									? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
									: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}"
							>
								{scan.status === 'saved' ? '✓' : '⚠'}
							</span>
							<span class="truncate font-mono text-[11px] text-slate-600 dark:text-slate-300">
								{scan.preview}
							</span>
						</div>
						<span class="font-mono text-[10px] text-slate-400">{scan.time}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

{#if notification}
	<div class="pointer-events-none fixed top-20 right-0 left-0 z-50 flex justify-center px-4">
		<div
			class="flex items-center gap-2 rounded-2xl px-6 py-3 font-mono text-sm font-bold text-white shadow-2xl transition-all
			{notification.type === 'success'
				? 'bg-emerald-600'
				: notification.type === 'warning'
					? 'bg-amber-600'
					: 'bg-rose-600'}"
		>
			{#if notification.type === 'success'}
				<span>✓</span>
			{:else if notification.type === 'warning'}
				<span>⚠</span>
			{:else}
				<span>✕</span>
			{/if}
			{notification.message}
		</div>
	</div>
{/if}
