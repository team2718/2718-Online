<script lang="ts">
	import { page } from '$app/state';
	import {
		Navbar,
		NavBrand,
		NavLi,
		NavUl,
		NavHamburger
	} from 'flowbite-svelte';

	let activeUrl = $derived(page.url.pathname);

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
				>2718 Online</span
			>
		</NavBrand>

		<div class="flex md:order-2">
			<NavHamburger />
		</div>

		<NavUl {activeUrl}>
			<NavLi href="/">Home</NavLi>
			<NavLi href="/teams">Teams</NavLi>
			<NavLi href="/scan">Scan QR</NavLi>
			<NavLi href="/pit-scout">Pit Scout</NavLi>
		</NavUl>
	{/snippet}
</Navbar>