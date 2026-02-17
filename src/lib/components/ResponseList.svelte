<script lang="ts">
	import type { RoboResponse } from '$lib/types.js';

	let { responses } = $props<{ responses: RoboResponse[] }>();

	let expanded = $state<string | null>(null);

	function toggle(name: string) {
		expanded = expanded === name ? null : name;
	}

	function timeAgo(dateStr: string) {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
</script>

<div class="space-y-2">
	<h3 class="text-sm font-semibold text-gray-700">Responses ({responses.length})</h3>

	{#if responses.length === 0}
		<p class="text-sm text-gray-500">No responses yet. Share the link to get started!</p>
	{:else}
		{#each responses as response}
			<div class="rounded-lg border border-gray-200 bg-white">
				<button
					onclick={() => toggle(response.participant_name)}
					class="flex w-full items-center justify-between p-3 text-left"
				>
					<div class="flex items-center gap-2">
						<div class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
							{response.participant_name.charAt(0).toUpperCase()}
						</div>
						<span class="text-sm font-medium text-gray-900">{response.participant_name}</span>
					</div>
					<span class="text-xs text-gray-400">{timeAgo(response.responded_at)}</span>
				</button>

				{#if expanded === response.participant_name}
					<div class="border-t border-gray-100 px-3 py-2">
						<pre class="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(response.response_data, null, 2)}</pre>
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>
