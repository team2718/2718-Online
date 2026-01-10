<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card, Heading } from 'flowbite-svelte';

	// From 1 to n
	function range(n: number) {
		return Array.from({ length: n }, (_, i) => i + 1);
	}
</script>

<div class="mt-px py-4">
	<div class="mt-px grid gap-4 px-4 py-4 xl:grid-cols-4 2xl:grid-cols-4">
		{#each range(10) as i (i)}
			<Card size="xl" class="max-w-none p-4 shadow-sm sm:p-6">
				<div class="items-center justify-between lg:flex">
					<div class="mt-px mb-4 lg:mb-0">
						<Heading tag="h3" class="mb-2 -ml-0.25 text-xl font-semibold dark:text-white"
							>Team {i}</Heading
						>
						<a href={resolve('/teams/{i}')}>View Team</a>
					</div>
				</div>
			</Card>
		{/each}
	</div>
</div>
