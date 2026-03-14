<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>rischedule</title>
	<meta name="description" content="Schedule events with natural language" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<header class="border-b border-gray-200 bg-white">
		<div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
			<a href="/" class="text-xl font-bold text-gray-900">
				ri<span class="text-indigo-600">schedule</span>
			</a>
			<p class="text-sm text-gray-500">group scheduling, simplified</p>
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-4 py-8">
		{@render children()}
	</main>
</div>
