<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let {
		teams = [],
		isAdmin = false,
		isPrivileged = false
	}: {
		teams?: { number: number; name: string }[];
		isAdmin?: boolean;
		isPrivileged?: boolean;
	} = $props();

	const activePath = $derived.by(() => {
		const path = page.url.pathname;
		if (path.startsWith('/teams')) return '/teams';
		if (path.startsWith('/matches')) return '/matches';
		if (path.startsWith('/reports')) return '/reports';
		if (path.startsWith('/pit-scout')) return '/pit-scout';
		if (path.startsWith('/alliance-selection')) return '/alliance-selection';
		if (path.startsWith('/admin')) return '/admin';
		if (path.startsWith('/scan')) return '/scan';
		return path;
	});

	const mainNav = [
		{ href: '/', label: 'Home' },
		{ href: '/teams', label: 'Teams' },
		{ href: '/matches', label: 'Matches' }
	] as const;

	const scoutNav = [
		{ href: '/reports', label: 'Reports' },
		{ href: '/scan', label: 'Scan QR' },
		{ href: '/pit-scout', label: 'Pit Scout' }
	] as const;

	// --- Mobile menu state ---
	let mobileOpen = $state(false);
	$effect(() => {
		if (page.url.pathname) {
			mobileOpen = false;
		}
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
		goto(resolve('/teams/[teamnum]', { teamnum: String(num) }));
	}

	function onSearchKeydown(e: KeyboardEvent) {
		if (!showDropdown) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = (selectedIndex + 1) % results.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = (selectedIndex - 1 + results.length) % results.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (selectedIndex >= 0 && selectedIndex < results.length) {
				selectTeam(results[selectedIndex].number);
			} else if (results.length > 0) {
				selectTeam(results[0].number);
			}
		} else if (e.key === 'Escape') {
			focused = false;
		}
	}

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
		if (typeof query === 'string') {
			selectedIndex = -1;
		}
	});

	// --- Auth popover ---
	let authOpen = $state(false);
	let authPassword = $state('');
	let authError = $state('');
	let authLoading = $state(false);
	let authContainerRef: HTMLElement | null = $state(null);
	let mobileAuthPanelRef: HTMLElement | null = $state(null);

	$effect(() => {
		function handleClickOutside(e: MouseEvent) {
			const target = e.target as Node;
			const inDesktop = authContainerRef && authContainerRef.contains(target);
			const inMobile = mobileAuthPanelRef && mobileAuthPanelRef.contains(target);
			if (!inDesktop && !inMobile) {
				authOpen = false;
				authError = '';
			}
		}
		if (authOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	async function handleAuthSubmit(e: SubmitEvent) {
		e.preventDefault();
		authLoading = true;
		authError = '';

		try {
			const formData = new FormData();
			formData.append('password', authPassword);

			const res = await fetch('?/login', {
				method: 'POST',
				body: formData
			});

			if (res.ok) {
				authPassword = '';
				authOpen = false;
				window.location.reload();
			} else {
				authError = 'Incorrect password';
			}
		} catch {
			authError = 'Authentication failed';
		} finally {
			authLoading = false;
		}
	}

	async function handleLogout() {
		try {
			await fetch('?/logout', { method: 'POST' });
			window.location.reload();
		} catch {
			// silent fallback
		}
	}

	const accessTierLabel = $derived.by(() => {
		if (isAdmin) return 'Admin';
		if (isPrivileged) return 'Team 2718 Member';
		return 'Guest';
	});

	const accessButtonClass = $derived.by(() =>
		isAdmin
			? 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50'
			: isPrivileged
				? 'text-amber-500 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50'
				: 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
	);
</script>

<svelte:window onkeydown={onGlobalKeydown} />

<nav class="px-4 py-2.5 sm:px-6">
	<div class="flex items-center justify-between gap-4 md:grid md:grid-cols-[auto_1fr_auto]">
		<!-- Left: Brand Logo -->
		<a
			href={resolve('/')}
			class="text-base font-bold tracking-tight text-slate-900 dark:text-white"
		>
			2718 Online
		</a>

		<!-- Center: Navigation Links -->
		<div class="hidden items-center justify-center gap-1 md:flex">
			{#each mainNav as link (link.href)}
				<a
					href={resolve(link.href)}
					class="rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all
						{activePath === link.href
						? 'bg-cyan-50 text-cyan-700 shadow-xs dark:bg-cyan-950/70 dark:text-cyan-300'
						: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'}"
				>
					{link.label}
				</a>
			{/each}

			<span class="mx-1 h-3.5 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true"></span>

			{#each scoutNav as link (link.href)}
				<a
					href={resolve(link.href)}
					class="rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all
						{activePath === link.href
						? 'bg-cyan-50 text-cyan-700 shadow-xs dark:bg-cyan-950/70 dark:text-cyan-300'
						: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'}"
				>
					{link.label}
				</a>
			{/each}

			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a
				href="/StrategyBoard.html"
				rel="external"
				target="_blank"
				class="rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
			>
				Strategy ↗
			</a>

			{#if isPrivileged}
				<span class="mx-1 h-3.5 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true"></span>
				<a
					href={resolve('/alliance-selection')}
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
					href={resolve('/admin')}
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
						{#each results as team, i (team.number)}
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
					type="button"
					onclick={() => (authOpen = !authOpen)}
					class="flex h-7 w-7 items-center justify-center rounded-lg transition-colors {accessButtonClass}"
					title={`Access: ${accessTierLabel}`}
					aria-label="Access tier"
				>
					{#if isAdmin}
						<!-- Shield Key for Admin -->
						<svg
							class="h-3.5 w-3.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							/>
						</svg>
					{:else if isPrivileged}
						<!-- Star Key for Member -->
						<svg
							class="h-3.5 w-3.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
							/>
						</svg>
					{:else}
						<!-- Lock for Guest -->
						<svg
							class="h-3.5 w-3.5"
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
					{/if}
				</button>

				<!-- Auth Popover Dropdown -->
				{#if authOpen}
					<div
						class="absolute top-full right-0 z-50 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900"
					>
						<div class="mb-3">
							<span class="text-xs font-bold text-slate-900 dark:text-white">
								{accessTierLabel}
							</span>
							<p class="text-[11px] text-slate-500 dark:text-slate-400">
								{#if isAdmin}
									Full administrative privileges enabled.
								{:else if isPrivileged}
									Scouting & match strategy mode unlocked.
								{:else}
									Enter password for team access or admin controls.
								{/if}
							</p>
						</div>

						{#if isAdmin || isPrivileged}
							<button
								type="button"
								onclick={handleLogout}
								class="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
							>
								Log Out
							</button>
						{:else}
							<form onsubmit={handleAuthSubmit} class="space-y-2">
								<input
									type="password"
									bind:value={authPassword}
									placeholder="Password…"
									class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
								/>
								{#if authError}
									<p class="text-[11px] text-rose-500">{authError}</p>
								{/if}
								<button
									type="submit"
									disabled={authLoading || !authPassword}
									class="w-full rounded-xl bg-cyan-600 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-cyan-700 disabled:opacity-50"
								>
									{authLoading ? 'Verifying…' : 'Unlock Access'}
								</button>
							</form>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Mobile Menu & Actions -->
		<div class="flex items-center gap-1.5 md:hidden">
			<!-- Mobile Auth Trigger -->
			<button
				type="button"
				onclick={() => (authOpen = !authOpen)}
				class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors {accessButtonClass}"
				title={`Access: ${accessTierLabel}`}
				aria-label="Access tier"
			>
				{#if isAdmin}
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
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
				{:else if isPrivileged}
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
							d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
						/>
					</svg>
				{:else}
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
				{/if}
			</button>

			<!-- Mobile Menu Trigger -->
			<button
				type="button"
				onclick={() => (mobileOpen = !mobileOpen)}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
				aria-label="Toggle navigation menu"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					{#if mobileOpen}
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					{/if}
				</svg>
			</button>
		</div>
	</div>

	<!-- Mobile Auth Dropdown (when toggled from mobile button) -->
	{#if authOpen}
		<div
			bind:this={mobileAuthPanelRef}
			class="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:hidden dark:border-slate-800 dark:bg-slate-900"
		>
			<div class="mb-3">
				<span class="text-xs font-bold text-slate-900 dark:text-white">
					{accessTierLabel}
				</span>
				<p class="text-[11px] text-slate-500 dark:text-slate-400">
					{#if isAdmin}
						Full administrative privileges enabled.
					{:else if isPrivileged}
						Scouting & match strategy mode unlocked.
					{:else}
						Enter password for team access or admin controls.
					{/if}
				</p>
			</div>

			{#if isAdmin || isPrivileged}
				<button
					type="button"
					onclick={handleLogout}
					class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
				>
					Log Out
				</button>
			{:else}
				<form onsubmit={handleAuthSubmit} class="space-y-2">
					<input
						type="password"
						bind:value={authPassword}
						placeholder="Password…"
						class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
					/>
					{#if authError}
						<p class="text-[11px] text-rose-500">{authError}</p>
					{/if}
					<button
						type="submit"
						disabled={authLoading || !authPassword}
						class="w-full rounded-xl bg-cyan-600 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-cyan-700 disabled:opacity-50"
					>
						{authLoading ? 'Verifying…' : 'Unlock Access'}
					</button>
				</form>
			{/if}
		</div>
	{/if}

	<!-- Mobile Navigation Drawer -->
	{#if mobileOpen}
		<div
			class="mt-2 space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl md:hidden dark:border-slate-800 dark:bg-slate-900"
		>
			<!-- Mobile Search -->
			<div class="relative">
				<input
					bind:value={query}
					onfocus={() => (focused = true)}
					onblur={() => setTimeout(() => (focused = false), 150)}
					type="search"
					placeholder="Search team # or name…"
					class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
				/>
				{#if showDropdown}
					<div
						class="mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
					>
						{#each results as team, i (team.number)}
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
				{#each mainNav as link (link.href)}
					<a
						href={resolve(link.href)}
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
				{#each scoutNav as link (link.href)}
					<a
						href={resolve(link.href)}
						class="block rounded-lg px-3 py-2 text-xs font-semibold transition-colors
							{activePath === link.href
							? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
							: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}"
					>
						{link.label}
					</a>
				{/each}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a
					href="/StrategyBoard.html"
					rel="external"
					target="_blank"
					class="block rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
				>
					Strategy Board ↗
				</a>
			</div>

			{#if isPrivileged}
				<hr class="my-2 border-slate-100 dark:border-slate-800" />
				<div class="space-y-1">
					<a
						href={resolve('/alliance-selection')}
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
						href={resolve('/admin')}
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
