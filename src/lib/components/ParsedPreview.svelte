<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ParsedEvent } from '$lib/types.js';

	let { event } = $props<{ event: ParsedEvent }>();

	let loading = $state(false);

	let name = $state(event.name);
	let participants = $state(event.participants.join(', '));
	let dates = $state(event.dates);
	let timePreference = $state(event.timePreference || 'any');

	function formatDate(iso: string) {
		return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function removeDate(index: number) {
		dates = dates.filter((_: string, i: number) => i !== index);
	}
</script>

<div class="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
	<div class="mb-4 flex items-center gap-2">
		<div class="rounded-lg bg-indigo-100 p-1.5 text-indigo-600">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<h3 class="font-semibold text-gray-900">Parsed Event</h3>
	</div>

	<form method="POST" action="?/create" use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			await update();
			loading = false;
		};
	}}>
		<div class="space-y-3">
			<div>
				<label for="name" class="mb-1 block text-sm font-medium text-gray-600">Event Name</label>
				<input
					id="name"
					name="name"
					type="text"
					bind:value={name}
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
				/>
			</div>

			<div>
				<label for="participants" class="mb-1 block text-sm font-medium text-gray-600">Participants</label>
				<input
					id="participants"
					name="participants"
					type="text"
					bind:value={participants}
					placeholder="Names, separated by commas"
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
				/>
			</div>

			<div>
				<label class="mb-1 block text-sm font-medium text-gray-600">Dates</label>
				<div class="flex flex-wrap gap-2">
					{#each dates as date, i}
						<span class="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm border border-gray-200">
							{formatDate(date)}
							<button type="button" onclick={() => removeDate(i)} class="ml-1 text-gray-400 hover:text-red-500">&times;</button>
						</span>
					{/each}
				</div>
				<input type="hidden" name="dates" value={JSON.stringify(dates)} />
			</div>

			<div>
				<label for="timePref" class="mb-1 block text-sm font-medium text-gray-600">Time Preference</label>
				<select
					id="timePref"
					name="timePreference"
					bind:value={timePreference}
					class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
				>
					<option value="any">Any time</option>
					<option value="morning">Morning</option>
					<option value="afternoon">Afternoon</option>
					<option value="evening">Evening</option>
				</select>
			</div>
		</div>

		<div class="mt-5 flex gap-3">
			<button
				type="submit"
				disabled={loading || dates.length === 0}
				class="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300"
			>
				{#if loading}
					Creating...
				{:else}
					Create Event
				{/if}
			</button>
			<a href="/" class="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
				Cancel
			</a>
		</div>
	</form>
</div>
