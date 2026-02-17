<script lang="ts">
	import { enhance } from '$app/forms';

	let { loading = false } = $props();
	let input = $state('');
</script>

<form method="POST" action="?/parse" use:enhance={() => {
	return async ({ update }) => {
		await update();
		input = '';
	};
}}>
	<div class="relative">
		<input
			name="input"
			type="text"
			bind:value={input}
			placeholder="e.g. Carwash with Matt, next Thu or Fri"
			class="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 pr-14 text-lg shadow-sm transition-shadow focus:border-indigo-400 focus:shadow-md focus:outline-none"
			disabled={loading}
		/>
		<button
			type="submit"
			disabled={!input.trim() || loading}
			class="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-indigo-600 p-2.5 text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300"
		>
			{#if loading}
				<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
					<path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="opacity-75" />
				</svg>
			{:else}
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
				</svg>
			{/if}
		</button>
	</div>
</form>
