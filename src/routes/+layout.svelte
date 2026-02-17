<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>rischedule</title>
	<meta name="description" content="Schedule events with natural language" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="bg-indigo-600 px-4 py-1.5 text-center text-xs text-indigo-100">
		made incredibly efficiently with <a href="https://robo.app" target="_blank" rel="noopener" class="font-semibold text-white underline underline-offset-2 hover:text-indigo-200">Robo</a>
	</div>

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
