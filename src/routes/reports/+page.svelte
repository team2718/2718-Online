<script lang="ts">
	export let data; // Data comes from +page.server.ts
</script>

<nav>
	<h1>Scouting Reports</h1>
	<div class="grid">
		{#each data.reports as report}
			<a href="/reports/{report.matchId}/{report.teamNumber}" class="report-button">
				<strong>{report.matchId}</strong> — Team {report.teamNumber}
				<small>Scouter: {report.scouterName}</small>
			</a>
		{/each}
	</div>
</nav>

<style>
	.grid { display: grid; gap: 1rem; padding: 1rem; }
	.report-button {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		background: #f9f9f9;
	}
	.report-button:hover { background: #eee; }
</style>