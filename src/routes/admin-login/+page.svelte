<script lang="ts">
	import { onMount } from 'svelte';

	async function hashPassword(pw: string) {
		const encoder = new TextEncoder();
		const data = encoder.encode(pw);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		return Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	}

	async function loginPopup() {
		const password = prompt('Enter admin password:');
		if (!password) return;

		const hashed = await hashPassword(password);
		const formData = new FormData();
		formData.set('password', hashed);

		const response = await fetch('/admin-login', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			window.location.href = '/admin';
		} else {
			alert('Incorrect password');
		}
	}

	onMount(() => {
		loginPopup();
	});
</script>
