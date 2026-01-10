<script lang="ts">
	import { page } from '$app/state';
	import {
		Navbar,
		NavBrand,
		NavLi,
		NavUl,
		NavHamburger,
		Search,
		ToolbarButton,
		DarkMode
	} from 'flowbite-svelte';
	import { SearchOutline } from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';
	let activeUrl = $derived(page.url.pathname);

	// Custom logic to set activeUrl for Teams and Home
	$effect(() => {
		const path = page.url.pathname;
		if (path === '/') {
			activeUrl = '/';
		} else if (path.startsWith('/teams')) {
			activeUrl = '/teams';
		} else {
			activeUrl = path;
		}
	});
</script>

<Navbar>
	{#snippet children({ hidden, toggle })}
		<NavBrand href="/">
			<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
				>Flowbite</span
			>
		</NavBrand>

		<div class="flex md:order-2">
			<ToolbarButton class="block md:hidden" onclick={toggle}>
				<SearchOutline class="h-5 w-5 text-gray-500 dark:text-gray-400" />
			</ToolbarButton>
			<div class="hidden md:block">
				<Search size="md" class="ms-auto" placeholder="Search..." />
			</div>
			<DarkMode />
			<NavHamburger />
		</div>

		{#if !hidden}
			<div class="mt-2 w-full md:hidden" transition:fade>
				<Search size="md" placeholder="Search..." />
			</div>
		{/if}

		<NavUl {activeUrl}>
			<NavLi href="/">Home</NavLi>
			<NavLi href="/teams">Teams</NavLi>
		</NavUl>
	{/snippet}
</Navbar>
