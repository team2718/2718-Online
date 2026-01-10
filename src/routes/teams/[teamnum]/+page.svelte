<script lang="ts">
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<div class="p-4">
	<a href={resolve('/teams/')} class="text-blue-600 hover:underline">← Back to Teams</a>
	<h1>Team {data.teamnum}</h1>
</div>
