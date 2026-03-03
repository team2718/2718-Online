<script lang="ts">
	import { onMount } from 'svelte';
	import { Html5Qrcode } from 'html5-qrcode';

	let scanner: Html5Qrcode;
	let status = "Waiting for scan...";

	onMount(() => {
		scanner = new Html5Qrcode("reader");
		
		scanner.start(
			{ facingMode: "environment" }, // Use back camera
			{ fps: 10, qrbox: { width: 250, height: 250 } },
			async (decodedText: any) => {
				try {
					const data = JSON.parse(decodedText);
					status = "Uploading report...";
					
					// Send data to your SvelteKit Action
					const formData = new FormData();
					formData.append('report', decodedText);

					console.log("Submitting report:", decodedText);
					
					const response = await fetch('?/submitScan', {
						method: 'POST',
						body: formData
					});

					if (response.ok) {
						status = "Success! Report saved.";
						// Optional: stop scanner after success
						// await scanner.stop();
					}
				} catch (e) {
					status = "Error: Invalid QR data format.";
				}
			},
			(errorMessage: any) => { /* Silently handle scan misses */ }
		);

		return () => scanner.stop();
	});
</script>

<main>
	<h1>Scan Scouting Report</h1>
	<div id="reader"></div>
	<p class="status">{status}</p>
</main>

<style>
	#reader { width: 100%; max-width: 420px; margin: auto; }
	.status { text-align: center; font-weight: bold; margin-top: 1rem; }
</style>