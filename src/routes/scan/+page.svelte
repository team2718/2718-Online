<script lang="ts">
	import { onMount } from 'svelte';
	import { Html5Qrcode } from 'html5-qrcode';

	let { data } = $props();

	let scanner: Html5Qrcode;
	let notification: { message: string; type: 'success' | 'error' | 'warning' } | null = $state(null);

	const showNotification = (message: string, type: 'success' | 'error' | 'warning', shouldPause: boolean) => {
		notification = { message, type };

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
		scanner = new Html5Qrcode('reader');

		scanner.start(
			{ facingMode: 'environment' },
			{ fps: 10, qrbox: { width: 250, height: 250 } },
			async (decodedText: string) => {
				if (notification && (notification.type === 'success' || notification.type === 'warning')) return;

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
						} else {
							const actionData = JSON.parse(result.data)[0];
							showNotification(actionData?.message || 'Scan failed.', 'error', false);
						}
						return;
					}

					showNotification('Saved', 'success', true);
				} catch {
					showNotification('Error: Invalid QR data.', 'error', false);
				}
			},
			() => {}
		);

		return () => scanner.stop();
	});
</script>

<div class="mx-auto max-w-lg px-4 py-6">
	<div class="mb-4 flex flex-wrap items-center justify-center gap-3">
		<h1 class="text-2xl font-black text-gray-900">Scan Scouting Report</h1>
		<a
			href="/admin"
			title="Change in Admin settings"
			class="rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wide
				{data.matchType === 'practice'
					? 'border-orange-200 bg-orange-50 text-orange-700'
					: 'border-green-200 bg-green-50 text-green-700'}"
		>
			{data.matchType === 'practice' ? 'Practice' : 'Qualification'} mode
		</a>
	</div>

	<div id="reader" class="w-full"></div>

	<p class="mt-4 text-center font-semibold text-gray-400">Waiting for scan...</p>
</div>

{#if notification}
	<div class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
		<div class="min-w-56 rounded-xl px-10 py-5 text-center text-lg font-bold text-white shadow-2xl
			{notification.type === 'success' ? 'bg-green-800' :
			 notification.type === 'warning' ? 'bg-orange-600' :
			                                   'bg-red-700'}">
			{notification.message}
		</div>
	</div>
{/if}
