<script lang="ts">
	export let data;
	const { report } = data;
</script>

<main>
	<header>
		<a href="/reports">← Back to List</a>
		<h1>Report: {report.matchId}</h1>
		<h2>Team {report.teamNumber}</h2>
	</header>

	<section class="details">
		<div class="meta">
			<p><strong>Scouter:</strong> {report.scouterName}</p>
			<p><strong>Timestamp:</strong> {new Date(report.createdAt! * 1000).toLocaleString()}</p>
		</div>

		<h3>Data:</h3>
		<pre>{JSON.stringify(report.data, null, 2)}</pre>
	</section>
</main>

<style>
	main { max-width: 800px; margin: auto; padding: 1rem; }
	.details { background: #fff; border: 1px solid #ddd; padding: 1.5rem; border-radius: 12px; }
	pre { background: #222; color: #0f0; padding: 1rem; overflow-x: auto; border-radius: 5px; }
</style>