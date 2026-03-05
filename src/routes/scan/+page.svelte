<script lang="ts">
	import { onMount } from 'svelte';
	import { Html5Qrcode } from 'html5-qrcode';

	let { data } = $props();

	let scanner: Html5Qrcode;
	let status = "Waiting for scan...";

	// Popup state
	let notification: { message: string; type: 'success' | 'error' | 'warning' } | null = null;

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
		scanner = new Html5Qrcode("reader");

		scanner.start(
			{ facingMode: "environment" },
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
					const actionData = JSON.parse(result.data);

					if (response.ok) {
						const label = actionData?.matchId ?? 'saved';
						showNotification(`Saved — ${label}`, 'success', true);
					} else if (response.status === 409) {
						showNotification("Duplicate: Already scanned!", 'warning', true);
					} else {
						const errorMsg = actionData?.message || "Scan failed.";
						showNotification(errorMsg, 'error', false);
					}
				} catch (e) {
					showNotification("Error: Invalid QR data.", 'error', false);
				}
			},
			(errorMessage: string) => { /* Silently handle scan misses */ }
		);

		return () => scanner.stop();
	});
</script>

<main>
	<div class="header">
		<h1>Scan Scouting Report</h1>
		<a
			href="/admin"
			class="mode-badge {data.matchType === 'practice' ? 'practice' : 'qualification'}"
			title="Change in Admin settings"
		>
			{data.matchType === 'practice' ? 'Practice' : 'Qualification'} mode
		</a>
	</div>

	<div class="scanner-container">
		<div id="reader"></div>

		{#if notification}
			<div class="popup {notification.type}">
				{notification.message}
			</div>
		{/if}
	</div>

	<p class="status">{status}</p>
</main>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	h1 {
		margin: 0;
	}

	.mode-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 700;
		text-decoration: none;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.mode-badge.qualification {
		background: #e8f5e9;
		color: #2e7d32;
		border: 1px solid #a5d6a7;
	}

	.mode-badge.practice {
		background: #fff8e1;
		color: #e65100;
		border: 1px solid #ffcc80;
	}

	.scanner-container {
		position: relative;
		width: 100%;
		max-width: 420px;
		margin: auto;
	}

	#reader { width: 100%; }

	.popup {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 1rem 2rem;
		border-radius: 8px;
		color: white;
		font-weight: bold;
		z-index: 10;
		text-align: center;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		animation: fadeIn 0.2s ease;
	}

	.success { background-color: #2e7d32; }
	.warning { background-color: #ed6c02; }
	.error { background-color: #d32f2f; }

	@keyframes fadeIn {
		from { opacity: 0; transform: translate(-50%, -40%); }
		to { opacity: 1; transform: translate(-50%, -50%); }
	}

	.status { text-align: center; font-weight: bold; margin-top: 1rem; }
</style>
