<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let loading = $state(false);

	function formatDate(iso: string) {
		return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDateShort(iso: string) {
		return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Respond – {data.name}</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<a href="/{data.code}" class="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			View results
		</a>
		<h1 class="text-2xl font-bold text-gray-900">{data.name}</h1>
		<p class="mt-1 text-sm text-gray-500">Mark the dates you're available</p>
	</div>

	{#if form?.submitted}
		<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
			<div class="mb-2 flex items-center gap-2">
				<div class="rounded-lg bg-emerald-200 p-1.5 text-emerald-700">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h2 class="font-semibold text-emerald-900">Response saved!</h2>
			</div>
			<p class="text-sm text-emerald-800">
				Thanks, <strong>{form.participantName}</strong>. Your availability has been recorded.
			</p>
			<a
				href="/{data.code}"
				class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 underline hover:text-emerald-900"
			>
				View results
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	{:else}
		<form
			method="POST"
			action="?/submit"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
			class="space-y-5"
		>
			<!-- Name -->
			<div class="rounded-2xl border border-gray-200 bg-white p-5">
				<label for="name" class="mb-2 block text-sm font-medium text-gray-700">Your name</label>
				<input
					id="name"
					name="name"
					type="text"
					required
					placeholder="e.g. Alex"
					disabled={loading}
					class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-gray-50"
				/>
			</div>

			<!-- Dates -->
			<div class="rounded-2xl border border-gray-200 bg-white p-5">
				<p class="mb-3 text-sm font-medium text-gray-700">Which dates work for you?</p>
				<div class="space-y-2">
					{#each data.dates as date}
						<label class="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:bg-indigo-50 has-[:checked]:border-indigo-300 has-[:checked]:bg-indigo-50">
							<input
								type="checkbox"
								name={date}
								disabled={loading}
								class="h-4 w-4 rounded accent-indigo-600"
							/>
							<span class="text-sm text-gray-800">{formatDate(date)}</span>
						</label>
					{/each}
				</div>
				{#if data.timePref && data.timePref !== 'any'}
					<p class="mt-3 text-xs text-gray-400">Preferred time: {data.timePref}</p>
				{/if}
			</div>

			{#if form?.error}
				<p class="text-sm text-red-600">{form.error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300"
			>
				{loading ? 'Saving...' : 'Submit availability'}
			</button>
		</form>
	{/if}
</div>
