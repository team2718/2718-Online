<script lang="ts">
	import { page } from '$app/state';
	import Navbar from './Navbar.svelte';
	import type { Snippet } from 'svelte';
	import '../app.css';

	interface Props {
		children: Snippet;
		data: {
			teamSearchList: { number: number; name: string }[];
			isAdmin: boolean;
			isPrivileged: boolean;
		};
	}
	let { children, data }: Props = $props();

	let title = $derived.by(() => {
		const parts = page.url.pathname
			.split('/')
			.slice(1)
			.filter(Boolean)
			.map((part) =>
				part
					.split('-')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ')
			);
		return ['2718 Online', ...parts].join(' • ');
	});
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<header
	class="fixed top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-colors dark:border-slate-800/80 dark:bg-slate-900/85"
>
	<Navbar teams={data.teamSearchList} isAdmin={data.isAdmin} isPrivileged={data.isPrivileged} />
</header>

<main class="mx-auto max-w-screen-2xl px-4 pt-20 pb-12 sm:px-6 sm:pt-22 lg:px-8">
	{@render children()}
</main>
