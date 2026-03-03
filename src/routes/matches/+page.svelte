<script lang="ts">
    import { Card, Heading } from 'flowbite-svelte';
    export let data;
</script>

<div class="p-6 max-w-4xl mx-auto">
    <Heading tag="h1" class="mb-6">Matches</Heading>
    <div class="grid gap-4 md:grid-cols-3">
        {#each data.matches as match}
            <Card href="/matches/{match.id}">
                <h5 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Match {match.matchNumber}
                </h5>
            </Card>
        {/each}
    </div>
</div>