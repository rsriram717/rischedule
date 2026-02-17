<script lang="ts">
	import type { EventSummary } from '$lib/types.js';

	let { event } = $props<{ event: EventSummary }>();

	let copied = $state(false);

	function copyLink() {
		if (event.shareLink) {
			navigator.clipboard.writeText(event.shareLink);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
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

<a href="/{event.hitId}" class="block rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
	<div class="flex items-start justify-between">
		<div class="min-w-0 flex-1">
			<h3 class="truncate font-semibold text-gray-900">{event.name}</h3>
			<p class="mt-1 text-sm text-gray-500">
				{event.responseCount} response{event.responseCount !== 1 ? 's' : ''}
				&middot; {timeAgo(event.createdAt)}
			</p>
		</div>
		<span class="ml-3 rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">{event.hitId}</span>
	</div>

	{#if event.shareLink}
		<div class="mt-3 flex items-center gap-2">
			<button
				onclick={(e: MouseEvent) => { e.stopPropagation(); copyLink(); }}
				class="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
			>
				{copied ? 'Copied!' : 'Copy availability link'}
			</button>
		</div>
	{/if}
</a>
