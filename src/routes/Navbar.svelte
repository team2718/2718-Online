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
		if (path.startsWith('/admin')) return '/admin';
		if (path.startsWith('/scan')) return '/scan';
		return path;
	});

	const mainNav = [
		{ href: '/', label: 'Home' },
		{ href: '/teams', label: 'Teams' },
		{ href: '/matches', label: 'Matches' }
	];

	const scoutNav = [
		{ href: '/reports', label: 'Reports' },
		{ href: '/scan', label: 'Scan QR' },
		{ href: '/pit-scout', label: 'Pit Scout' },
		{ href: '/StrategyBoard.html', label: 'Strategy' }
	];

	// --- Mobile menu state ---
	let mobileOpen = $state(false);
	$effect(() => {
		page.url.pathname;
		mobileOpen = false;
	});

	// --- Search state & keyboard shortcut ---
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
		mobileOpen = false;
		goto(`/teams/${num}`);
	}

	function onSearchKeydown(e: KeyboardEvent) {
		if (!showDropdown) {
			if (e.key === 'Escape') {
				query = '';
				searchRef?.blur();
			}
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

	// Global hotkey: press '/' to focus search when not in an input
	function onGlobalKeydown(e: KeyboardEvent) {
		if (
			e.key === '/' &&
			document.activeElement?.tagName !== 'INPUT' &&
			document.activeElement?.tagName !== 'TEXTAREA'
		) {
			e.preventDefault();
			searchRef?.focus();
		}
	}

	$effect(() => {
		query;
		selectedIndex = -1;
	});

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
				const data = await res.json().catch(() => ({}));
				authError = data.error || 'Incorrect password';
				authPassword = '';
			}
		} catch {
			authError = 'Network connection error';
		} finally {
			authLoading = false;
		}
	}

	async function logout() {
		window.location.href = '/logout';
	}

	function onAuthKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') submitAuth();
		if (e.key === 'Escape') authOpen = false;
	}

	const roleLabel = $derived(isAdmin ? 'Admin' : isPrivileged ? 'Privileged' : 'Guest');
	const lockColorClass = $derived(
		isAdmin
			? 'text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50'
			: isPrivileged
				? 'text-amber-500 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50'
				: 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
	);
</script>

<svelte:window onkeydown={onGlobalKeydown} />

<nav class="px-4 py-2.5 sm:px-6">
	<div class="flex items-center justify-between gap-4 md:grid md:grid-cols-[auto_1fr_auto]">
		<!-- Left: Brand Logo -->
		<a href="/" class="text-base font-bold tracking-tight text-slate-900 dark:text-white">
			2718 Online
		</a>

		<!-- Center: Navigation Links -->
		<div class="hidden items-center justify-center gap-1 md:flex">
			{#each mainNav as link}
				<a
					href={link.href}
					class="rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all
						{activePath === link.href
						? 'bg-cyan-50 text-cyan-700 shadow-xs dark:bg-cyan-950/70 dark:text-cyan-300'
						: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'}"
				>
					{link.label}
				</a>
			{/each}

			<span class="mx-1 h-3.5 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true"></span>

			{#each scoutNav as link}
				<a
					href={link.href}
					class="rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all
						{activePath === link.href
						? 'bg-cyan-50 text-cyan-700 shadow-xs dark:bg-cyan-950/70 dark:text-cyan-300'
						: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'}"
				>
					{link.label}
				</a>
			{/each}

			{#if isPrivileged}
				<span class="mx-1 h-3.5 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true"></span>
				<a
					href="/alliance-selection"
					class="rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all
						{activePath === '/alliance-selection'
						? 'bg-emerald-50 text-emerald-700 shadow-xs dark:bg-emerald-950/70 dark:text-emerald-300'
						: 'text-emerald-600 hover:bg-emerald-50/80 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40'}"
				>
					Alliance Selection
				</a>
			{/if}

			{#if isAdmin}
				<span class="mx-1 h-3.5 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true"></span>
				<a
					href="/admin"
					class="rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all
						{activePath === '/admin'
						? 'bg-rose-50 text-rose-700 shadow-xs dark:bg-rose-950/70 dark:text-rose-300'
						: 'text-rose-600 hover:bg-rose-50/80 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40'}"
				>
					Admin
				</a>
			{/if}
		</div>

		<!-- Right: Quick Search + Auth -->
		<div class="hidden items-center justify-end gap-2.5 md:flex">
			<!-- Fast Search -->
			<div class="relative">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
					<svg
						class="h-3.5 w-3.5 text-slate-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
						/>
					</svg>
				</div>
				<input
					bind:this={searchRef}
					bind:value={query}
					onfocus={() => (focused = true)}
					onblur={() => setTimeout(() => (focused = false), 150)}
					onkeydown={onSearchKeydown}
					type="search"
					placeholder="Search team…"
					class="w-40 rounded-lg border border-slate-200 bg-slate-50/80 py-1.5 pr-7 pl-8 text-xs text-slate-800 transition-all outline-none placeholder:text-slate-400 focus:w-56 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:bg-slate-900"
				/>
				<div
					class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 font-mono text-[10px] text-slate-400 dark:text-slate-500"
				>
					/
				</div>

				<!-- Search Results Dropdown -->
				{#if showDropdown}
					<div
						class="absolute top-full right-0 z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-1 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95"
					>
						{#each results as team, i}
							<button
								type="button"
								onmousedown={() => selectTeam(team.number)}
								class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-950/50
									{i === selectedIndex ? 'bg-cyan-50 dark:bg-cyan-950/60' : ''}"
							>
								<span
									class="flex h-5 w-10 items-center justify-center rounded bg-cyan-100 font-mono font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"
								>
									{team.number}
								</span>
								<span class="truncate font-medium text-slate-700 dark:text-slate-300"
									>{team.name}</span
								>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Auth Popover Button -->
			<div class="relative" bind:this={authContainerRef}>
				<button
					onclick={toggleAuth}
					class="flex items-center gap-1.5 rounded-lg p-1.5 text-xs font-semibold transition-colors {lockColorClass}"
					aria-label="Authentication"
					title="Role: {roleLabel}"
				>
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
					{#if isAdmin || isPrivileged}
						<span class="text-[11px] font-bold">{roleLabel}</span>
					{/if}
				</button>

				{#if authOpen}
					<div
						class="absolute top-full right-0 z-50 mt-2 w-68 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
					>
						<div
							class="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800"
						>
							<p
								class="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400"
							>
								Access Level
							</p>
							<span
								class="rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase
								{isAdmin
									? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
									: isPrivileged
										? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
										: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}"
							>
								{roleLabel}
							</span>
						</div>

						<div class="pt-3">
							<label
								for="desktopAuthPassword"
								class="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
							>
								Password
							</label>
							<input
								id="desktopAuthPassword"
								type="password"
								bind:value={authPassword}
								onkeydown={onAuthKeydown}
								placeholder="Enter admin password"
								class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:bg-slate-900"
							/>
							{#if authError}
								<p class="mt-1.5 text-[11px] font-medium text-rose-500">{authError}</p>
							{/if}
							<button
								onclick={submitAuth}
								disabled={authLoading || !authPassword}
								class="mt-3 w-full rounded-lg bg-cyan-600 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-cyan-700 disabled:opacity-50 dark:bg-cyan-500 dark:hover:bg-cyan-600"
							>
								{authLoading ? 'Verifying…' : 'Authenticate'}
							</button>

							{#if isPrivileged}
								<button
									onclick={logout}
									class="mt-1.5 w-full rounded-lg py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
								>
									Log out
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Mobile Header Controls -->
		<div class="flex items-center gap-1 md:hidden">
			<button
				onclick={toggleAuth}
				class="rounded-lg p-2 transition-colors {lockColorClass}"
				aria-label="Authenticate"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
			</button>
			<button
				onclick={() => {
					mobileOpen = !mobileOpen;
					authOpen = false;
				}}
				class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none dark:text-slate-400 dark:hover:bg-slate-800"
				aria-label="Toggle menu"
			>
				{#if mobileOpen}
					<svg
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Auth Popover -->
	{#if authOpen && !mobileOpen}
		<div
			bind:this={mobileAuthPanelRef}
			class="mt-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-lg md:hidden dark:border-slate-800 dark:bg-slate-900"
		>
			<div
				class="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800"
			>
				<p class="text-xs font-bold tracking-wider text-slate-500 uppercase">Access Level</p>
				<span
					class="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
				>
					{roleLabel}
				</span>
			</div>
			<div class="pt-3">
				<input
					type="password"
					bind:value={authPassword}
					onkeydown={onAuthKeydown}
					placeholder="Enter password"
					class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
				/>
				{#if authError}
					<p class="mt-1 text-xs font-semibold text-rose-500">{authError}</p>
				{/if}
				<button
					onclick={submitAuth}
					disabled={authLoading || !authPassword}
					class="mt-2.5 w-full rounded-lg bg-cyan-600 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-cyan-700 disabled:opacity-50 dark:bg-cyan-500"
				>
					{authLoading ? 'Verifying…' : 'Authenticate'}
				</button>
				{#if isPrivileged}
					<button
						onclick={logout}
						class="mt-1.5 w-full rounded-lg py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
					>
						Log out
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Mobile Drawer -->
	{#if mobileOpen}
		<div class="mt-2 border-t border-slate-100 pt-3 md:hidden dark:border-slate-800">
			<!-- Search on Mobile -->
			<div class="relative mb-3">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<svg
						class="h-4 w-4 text-slate-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
						/>
					</svg>
				</div>
				<input
					bind:value={query}
					onfocus={() => (focused = true)}
					onblur={() => setTimeout(() => (focused = false), 150)}
					onkeydown={onSearchKeydown}
					type="search"
					placeholder="Search by team # or name…"
					class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
				/>
				{#if showDropdown}
					<div
						class="mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
					>
						{#each results as team, i}
							<button
								type="button"
								onmousedown={() => selectTeam(team.number)}
								class="flex w-full items-center gap-3 px-3 py-2 text-left text-xs hover:bg-cyan-50 dark:hover:bg-cyan-950/40
									{i === selectedIndex ? 'bg-cyan-50 dark:bg-cyan-950/50' : ''}"
							>
								<span class="w-12 font-mono font-bold text-cyan-700 dark:text-cyan-400"
									>{team.number}</span
								>
								<span class="truncate text-slate-600 dark:text-slate-300">{team.name}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="space-y-1">
				{#each mainNav as link}
					<a
						href={link.href}
						class="block rounded-lg px-3 py-2 text-xs font-semibold transition-colors
							{activePath === link.href
							? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
							: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}"
					>
						{link.label}
					</a>
				{/each}
			</div>

			<hr class="my-2 border-slate-100 dark:border-slate-800" />

			<div class="space-y-1">
				{#each scoutNav as link}
					<a
						href={link.href}
						class="block rounded-lg px-3 py-2 text-xs font-semibold transition-colors
							{activePath === link.href
							? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
							: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}"
					>
						{link.label}
					</a>
				{/each}
			</div>

			{#if isPrivileged}
				<hr class="my-2 border-slate-100 dark:border-slate-800" />
				<div class="space-y-1">
					<a
						href="/alliance-selection"
						class="block rounded-lg px-3 py-2 text-xs font-semibold transition-colors
							{activePath === '/alliance-selection'
							? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
							: 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40'}"
					>
						Alliance Selection
					</a>
				</div>
			{/if}

			{#if isAdmin}
				<hr class="my-2 border-slate-100 dark:border-slate-800" />
				<div class="space-y-1">
					<a
						href="/admin"
						class="block rounded-lg px-3 py-2 text-xs font-semibold transition-colors
							{activePath === '/admin'
							? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
							: 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'}"
					>
						Admin
					</a>
				</div>
			{/if}
		</div>
	{/if}
</nav>
