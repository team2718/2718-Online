<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	interface Props {
		teams?: { number: number; name: string }[];
		isAdmin?: boolean;
		isPrivileged?: boolean;
	}
	let { teams = [], isAdmin = false, isPrivileged = false }: Props = $props();

	const activePath = $derived.by(() => {
		const path = page.url.pathname;
		if (path === '/') return '/';
		if (path.startsWith('/teams')) return '/teams';
		if (path.startsWith('/pit-scout')) return '/pit-scout';
		if (path.startsWith('/reports')) return '/reports';
		if (path.startsWith('/matches')) return '/matches';
		if (path.startsWith('/alliance-selection')) return '/alliance-selection';
		return path;
	});

	const navGroup1 = [
		{ href: '/', label: 'Home' },
		{ href: '/teams', label: 'Teams' },
		{ href: '/matches', label: 'Matches' }
	];

	const navGroup2 = [
		{ href: '/reports', label: 'Reports' },
		{ href: '/scan', label: 'Scan QR' },
		{ href: '/pit-scout', label: 'Pit Scout' },
		{ href: '/StrategyBoard.html', label: 'Strategy Board' }
	];

	// --- Mobile menu ---
	let mobileOpen = $state(false);
	$effect(() => { page.url.pathname; mobileOpen = false; });

	// --- Search ---
	let query = $state('');
	let focused = $state(false);
	let selectedIndex = $state(-1);
	let searchRef: HTMLInputElement | null = $state(null);

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return teams
			.filter((t) => String(t.number).includes(q) || t.name.toLowerCase().includes(q))
			.slice(0, 8);
	});

	const showDropdown = $derived(focused && results.length > 0);

	function selectTeam(num: number) {
		query = '';
		focused = false;
		selectedIndex = -1;
		goto(`/teams/${num}`);
	}

	function onKeydown(e: KeyboardEvent) {
		if (!showDropdown) {
			if (e.key === 'Escape') { query = ''; searchRef?.blur(); }
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, -1);
		} else if (e.key === 'Enter' && selectedIndex >= 0) {
			e.preventDefault();
			selectTeam(results[selectedIndex].number);
		} else if (e.key === 'Escape') {
			query = '';
			focused = false;
			selectedIndex = -1;
			searchRef?.blur();
		}
	}

	$effect(() => { query; selectedIndex = -1; });

	// --- Auth popover ---
	let authOpen = $state(false);
	let authPassword = $state('');
	let authError = $state('');
	let authLoading = $state(false);
	let authContainerRef: HTMLElement | null = $state(null);
	let mobileAuthPanelRef: HTMLElement | null = $state(null);

	$effect(() => {
		if (!authOpen) return;
		function handleClickOutside(e: MouseEvent) {
			const inDesktop = authContainerRef?.contains(e.target as Node);
			const inMobile = mobileAuthPanelRef?.contains(e.target as Node);
			if (!inDesktop && !inMobile) {
				authOpen = false;
			}
		}
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});

	function toggleAuth(e: MouseEvent) {
		e.stopPropagation();
		authOpen = !authOpen;
		if (authOpen) {
			authPassword = '';
			authError = '';
		}
	}

	async function submitAuth() {
		if (!authPassword) return;
		authLoading = true;
		authError = '';
		try {
			const res = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: authPassword })
			});
			if (res.ok) {
				window.location.reload();
			} else {
				authError = 'Incorrect password';
				authPassword = '';
			}
		} catch {
			authError = 'Network error';
		} finally {
			authLoading = false;
		}
	}

	async function logout() {
		await fetch('/api/auth', { method: 'DELETE' });
		window.location.reload();
	}

	function onAuthKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') submitAuth();
		if (e.key === 'Escape') authOpen = false;
	}

	// Lock icon color class
	const lockColorClass = $derived(
		isAdmin ? 'text-red-500' : isPrivileged ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'
	);
</script>

<!-- Desktop: 3-column grid keeps links truly centered -->
<nav class="px-4 py-3">
	<div class="hidden items-center md:grid md:grid-cols-[1fr_auto_1fr]">
		<!-- Left: Brand -->
		<a href="/" class="text-xl font-semibold text-gray-900 whitespace-nowrap dark:text-white">
			2718 Online
		</a>

		<!-- Center: Nav links split into two groups -->
		<div class="flex items-center gap-1">
			{#each navGroup1 as link}
				<a
					href={link.href}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors
						{activePath === link.href
							? 'text-blue-600'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
				>
					{link.label}
				</a>
			{/each}
			<!-- Group divider -->
			<span class="mx-1 h-4 w-px bg-gray-300" aria-hidden="true"></span>
			{#each navGroup2 as link}
				<a
					href={link.href}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors
						{activePath === link.href
							? 'text-blue-600'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
				>
					{link.label}
				</a>
			{/each}
			{#if isAdmin}
				<span class="mx-1 h-4 w-px bg-gray-300" aria-hidden="true"></span>
				<a
					href="/admin"
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors
						{activePath === '/admin'
							? 'text-red-600'
							: 'text-red-500 hover:bg-red-50 hover:text-red-700'}"
				>
					Admin
				</a>
			{/if}
			{#if isPrivileged}
				<span class="mx-1 h-4 w-px bg-gray-300" aria-hidden="true"></span>
				<a
					href="/alliance-selection"
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors
						{activePath === '/alliance-selection'
							? 'text-green-700'
							: 'text-green-600 hover:bg-green-50 hover:text-green-800'}"
				>
					Alliance Selection
				</a>
			{/if}
		</div>

		<!-- Right: Search + Auth -->
		<div class="flex items-center justify-end gap-2">
			<div class="relative">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
					</svg>
				</div>
				<input
					bind:this={searchRef}
					bind:value={query}
					onfocus={() => (focused = true)}
					onblur={() => setTimeout(() => (focused = false), 150)}
					onkeydown={onKeydown}
					type="search"
					placeholder="Search"
					class="w-44 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pr-3 pl-9 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:w-60 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
				/>
				{#if showDropdown}
					<div class="absolute top-full right-0 z-50 mt-1 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
						{#each results as team, i}
							<button
								type="button"
								onmousedown={() => selectTeam(team.number)}
								class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-blue-50
									{i === selectedIndex ? 'bg-blue-50' : ''}
									{i > 0 ? 'border-t border-gray-100' : ''}"
							>
								<span class="w-12 font-bold text-gray-800">{team.number}</span>
								<span class="truncate text-sm text-gray-500">{team.name}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Auth button -->
			<div class="relative" bind:this={authContainerRef}>
				<button
					onclick={toggleAuth}
					class="rounded-lg p-1.5 transition-colors {lockColorClass}"
					aria-label="Authenticate"
					title={isAdmin ? 'Admin' : isPrivileged ? 'Privileged' : 'Authenticate'}
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
					</svg>
				</button>

				{#if authOpen}
					<div class="absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
						<div class="p-3">
							<p class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Authenticate</p>
							<input
								type="password"
								bind:value={authPassword}
								onkeydown={onAuthKeydown}
								placeholder="Password"
								class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
							/>
							{#if authError}
								<p class="mt-1 text-xs text-red-500">{authError}</p>
							{/if}
							<button
								onclick={submitAuth}
								disabled={authLoading || !authPassword}
								class="mt-2 w-full rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
							>
								{authLoading ? 'Authenticating…' : 'Authenticate'}
							</button>
							{#if isPrivileged}
								<button
									onclick={logout}
									class="mt-1 w-full rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100"
								>
									Logout
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Mobile: brand + hamburger -->
	<div class="flex items-center justify-between md:hidden">
		<a href="/" class="text-xl font-semibold text-gray-900 dark:text-white">2718 Online</a>
		<div class="flex items-center gap-1">
			<!-- Mobile auth button -->
			<button
				onclick={toggleAuth}
				class="rounded-lg p-2 transition-colors {lockColorClass}"
				aria-label="Authenticate"
				title={isAdmin ? 'Admin' : isPrivileged ? 'Privileged' : 'Authenticate'}
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
				</svg>
			</button>
			<button
				onclick={() => { mobileOpen = !mobileOpen; authOpen = false; }}
				class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none"
				aria-label="Toggle menu"
			>
				{#if mobileOpen}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				{:else}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile auth popover (shown below the top bar when open) -->
	{#if authOpen && mobileOpen === false}
		<div bind:this={mobileAuthPanelRef} class="mt-2 border-t border-gray-100 pt-3 md:hidden">
			<p class="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Authenticate</p>
			<input
				type="password"
				bind:value={authPassword}
				onkeydown={onAuthKeydown}
				placeholder="Password"
				class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
			/>
			{#if authError}
				<p class="mt-1 text-xs text-red-500">{authError}</p>
			{/if}
			<button
				onclick={submitAuth}
				disabled={authLoading || !authPassword}
				class="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
			>
				{authLoading ? 'Authenticating…' : 'Authenticate'}
			</button>
			{#if isPrivileged}
				<button
					onclick={logout}
					class="mt-1 w-full rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100"
				>
					Logout
				</button>
			{/if}
		</div>
	{/if}

	<!-- Mobile menu -->
	{#if mobileOpen}
		<div class="mt-2 border-t border-gray-100 pt-3 md:hidden">
			<div class="space-y-1">
				{#each navGroup1 as link}
					<a
						href={link.href}
						class="block rounded-md px-3 py-2 text-sm font-medium
							{activePath === link.href
								? 'bg-blue-50 text-blue-600'
								: 'text-gray-700 hover:bg-gray-100'}"
					>
						{link.label}
					</a>
				{/each}
			</div>
			<hr class="my-2 border-gray-200" />
			<div class="space-y-1">
				{#each navGroup2 as link}
					<a
						href={link.href}
						class="block rounded-md px-3 py-2 text-sm font-medium
							{activePath === link.href
								? 'bg-blue-50 text-blue-600'
								: 'text-gray-700 hover:bg-gray-100'}"
					>
						{link.label}
					</a>
				{/each}
			</div>
			{#if isAdmin}
				<hr class="my-2 border-gray-200" />
				<div class="space-y-1">
					<a
						href="/admin"
						class="block rounded-md px-3 py-2 text-sm font-medium
							{activePath === '/admin'
								? 'bg-red-50 text-red-600'
								: 'text-red-500 hover:bg-red-50 hover:text-red-700'}"
					>
						Admin
					</a>
				</div>
			{/if}
			{#if isPrivileged}
				<hr class="my-2 border-gray-200" />
				<div class="space-y-1">
					<a
						href="/alliance-selection"
						class="block rounded-md px-3 py-2 text-sm font-medium
							{activePath === '/alliance-selection'
								? 'bg-green-50 text-green-700'
								: 'text-green-600 hover:bg-green-50 hover:text-green-800'}"
					>
						Alliance Selection
					</a>
				</div>
			{/if}

			<!-- Mobile search -->
			<div class="relative mt-3">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
					</svg>
				</div>
				<input
					bind:value={query}
					onfocus={() => (focused = true)}
					onblur={() => setTimeout(() => (focused = false), 150)}
					onkeydown={onKeydown}
					type="search"
					placeholder="Team # or name…"
					class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-3 pl-9 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
				/>
				{#if showDropdown}
					<div class="mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
						{#each results as team, i}
							<button
								type="button"
								onmousedown={() => selectTeam(team.number)}
								class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-blue-50
									{i === selectedIndex ? 'bg-blue-50' : ''}
									{i > 0 ? 'border-t border-gray-100' : ''}"
							>
								<span class="w-12 font-bold text-gray-800">{team.number}</span>
								<span class="truncate text-sm text-gray-500">{team.name}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</nav>
