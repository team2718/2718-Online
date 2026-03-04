<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Card, Heading, Label, Input, Button } from 'flowbite-svelte';

	// Login State
	let password = '';
	let errorMessage = '';
	let submitting = false;
	let passwordInput: HTMLInputElement;

	// Generator State
	let generateInput = '';
	let generatedHash = '';

	// Keep the hash function solely for the generator tool
	async function hashPassword(pw: string) {
		const encoder = new TextEncoder();
		const data = encoder.encode(pw);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		return Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	}

	async function login() {
		if (!password || submitting) return;

		submitting = true;
		errorMessage = '';

		// FIX: Send the plaintext password directly. The server now handles the hashing.
		const formData = new FormData();
		formData.set('password', password);

		const response = await fetch('/admin-login', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			window.location.href = '/admin';
		} else {
			errorMessage = 'Incorrect password';
			password = '';
			passwordInput?.focus();
		}

		submitting = false;
	}

	async function handleGenerate() {
		if (!generateInput) {
			generatedHash = '';
			return;
		}
		generatedHash = await hashPassword(generateInput);
	}

	onMount(async () => {
		await tick();
		passwordInput?.focus();
	});
</script>

<main class="flex min-h-[80svh] flex-col items-center justify-center gap-8 px-4 py-8">
	<Card size="sm" class="w-full p-8">
		<Heading tag="h1" class="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
			Admin Login
		</Heading>
		<form class="flex flex-col gap-5" on:submit|preventDefault={login}>
			<div>
				<Label for="admin-password" class="mb-2">Password</Label>
				<Input
					id="admin-password"
					bind:elementRef={passwordInput}
					type="password"
					bind:value={password}
					autocomplete="current-password"
					required
				/>
			</div>

			{#if errorMessage}
				<p class="text-sm font-medium text-red-600 dark:text-red-500">{errorMessage}</p>
			{/if}

			<Button type="submit" disabled={submitting} class="w-full">
				{submitting ? 'Checking...' : 'Log in'}
			</Button>
		</form>
	</Card>

	<Card size="sm" class="w-full bg-gray-50 p-8 dark:bg-gray-800">
		<Heading tag="h2" class="mb-4 text-center text-lg font-bold text-gray-900 dark:text-white">
			Hash Generator
		</Heading>
		<div class="flex flex-col gap-4">
			<div>
				<Label for="hash-input" class="mb-2">Desired Password</Label>
				<Input
					id="hash-input"
					type="text"
					bind:value={generateInput}
					placeholder="Enter plaintext password..."
				/>
			</div>
			<Button onclick={handleGenerate} class="w-full" color="light">Generate Hash</Button>

			{#if generatedHash}
				<div class="mt-2">
					<Label class="mb-2 text-green-600 dark:text-green-400">Generated SHA-256 Hash</Label>
					<Input type="text" readonly value={generatedHash} class="cursor-text font-mono text-xs" />
				</div>
			{/if}
		</div>
	</Card>
</main>
