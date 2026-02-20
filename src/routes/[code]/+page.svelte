<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import HeatmapGrid from '$lib/components/HeatmapGrid.svelte';
	import BestTime from '$lib/components/BestTime.svelte';
	import ResponseList from '$lib/components/ResponseList.svelte';

	let { data } = $props();

	let copied = $state(false);
	let mode = $state<'organizing' | 'responding'>('responding');

	const allParticipants = $derived(data.responses.map((r: { participant_name: string }) => r.participant_name));

	function copyLink() {
		if (data.shareLink) {
			navigator.clipboard.writeText(data.shareLink);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	// Default to organizing mode when navigating from event creation
	onMount(() => {
		if ($page.url.searchParams.get('organizer') === '1') {
			mode = 'organizing';
		}
		const interval = setInterval(() => invalidateAll(), 10000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>{data.name} - rischedule</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<a href="/" class="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Back
		</a>

		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">{data.name}</h1>
				<p class="mt-1 text-sm text-gray-500">
					Code: <code class="rounded bg-gray-100 px-2 py-0.5 font-mono">{data.code}</code>
				</p>
			</div>
		</div>
	</div>

	<!-- Mode toggle -->
	<div class="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
		<button
			onclick={() => (mode = 'responding')}
			class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors {mode === 'responding' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
		>
			Responding
		</button>
		<button
			onclick={() => (mode = 'organizing')}
			class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors {mode === 'organizing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
		>
			Organizing
		</button>
	</div>

	<!-- Responding mode: link to fill out availability -->
	{#if mode === 'responding' && data.shareLink}
		<div class="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
			<p class="mb-3 text-sm font-medium text-gray-700">Fill out your availability:</p>
			<a
				href={data.shareLink}
				target="_blank"
				rel="noopener"
				class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
			>
				Open availability form
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
				</svg>
			</a>
			<p class="mt-3 text-xs text-indigo-600">
				Your event code is <code class="rounded bg-indigo-100 px-1.5 py-0.5 font-mono font-semibold">{data.code}</code> — save it to check results later at <a href="/" class="underline">rischedule</a>
			</p>
		</div>
	{/if}

	<!-- Organizing mode: share link -->
	{#if mode === 'organizing' && data.shareLink}
		<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
			<p class="mb-3 text-sm font-medium text-emerald-800">Share this link with participants:</p>
			<div class="flex items-center gap-2 rounded-lg bg-white p-3 border border-emerald-200">
				<code class="flex-1 truncate text-sm text-gray-700">{data.shareLink}</code>
				<button
					onclick={copyLink}
					class="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
				>
					{copied ? 'Copied!' : 'Copy'}
				</button>
			</div>
			<p class="mt-2 text-xs text-emerald-700">
				Participants can also view results at this page using code <code class="font-mono font-semibold">{data.code}</code>
			</p>
		</div>
	{/if}

	<!-- Best Time -->
	<BestTime slot={data.bestSlot} />

	<!-- Heatmap -->
	{#if data.slots.length > 0}
		<section>
			<h2 class="mb-3 text-lg font-semibold text-gray-900">Availability</h2>
			<div class="rounded-2xl border border-gray-200 bg-white p-4">
				<HeatmapGrid slots={data.slots} participants={allParticipants} />
			</div>
		</section>
	{/if}

	<!-- Responses -->
	<section>
		<ResponseList responses={data.responses} />
	</section>

	<!-- Auto-refresh notice -->
	<p class="text-center text-xs text-gray-400">Auto-refreshes every 10 seconds</p>
</div>
