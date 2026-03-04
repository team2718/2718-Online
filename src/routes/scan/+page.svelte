<script lang="ts">
	import { onMount } from 'svelte';
	import { Html5Qrcode } from 'html5-qrcode';

	let scanner: Html5Qrcode;
	let status = "Waiting for scan...";
	
	// Popup state
	let notification: { message: string; type: 'success' | 'error' | 'warning' } | null = null;

	const showNotification = (message: string, type: 'success' | 'error' | 'warning', shouldPause: boolean) => {
		notification = { message, type };
		
		if (shouldPause) {
			scanner.pause(true); // Pause with visual overlay
		}

		// Clear notification and resume after 1.5 seconds
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
				// Prevent double-processing if a scan is already mid-flight
				if (notification && (notification.type === 'success' || notification.type === 'warning')) return;

				try {
					const formData = new FormData();
					formData.append('report', decodedText);
					
					const response = await fetch('?/submitScan', {
						method: 'POST',
						body: formData
					});

					const result = await response.json();
					// SvelteKit actions wrap the return in a 'data' or 'error' object
					const actionData = JSON.parse(result.data);

					if (response.ok) {
						showNotification("Success! Report saved.", 'success', true);
					} else if (response.status === 409) {
						showNotification("Duplicate: Already scanned!", 'warning', true);
					} else {
						// Other failures (400, 500) don't pause the scanner
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
	<h1>Scan Scouting Report</h1>
	
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