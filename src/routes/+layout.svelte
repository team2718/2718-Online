<script lang="ts">
	import { page } from '$app/stores';
	import Navbar from './Navbar.svelte';
	import type { Snippet } from 'svelte';
	import '../app.css';
	interface Props {
		children: Snippet;
		data: { teamSearchList: { number: number; name: string }[]; isAdmin: boolean; isPrivileged: boolean };
	}
	let { children, data }: Props = $props();

	let title = $derived(
		[
			'2718 Online',
			...$page.url.pathname
				.split('/')
				.slice(1)
				.filter(Boolean)
				.map((part) =>
					part
						.split('-')
						.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' ')
				)
		].join(' - ')
	);
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<h1 class="hidden">{title}</h1>

<header
	class="fixed top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
>
	<Navbar teams={data.teamSearchList} isAdmin={data.isAdmin} isPrivileged={data.isPrivileged} />
</header>

<div class="mx-auto max-w-screen-2xl pt-[98px] pr-4 pb-10 pl-4">
	{@render children()}
</div>
