<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ParsedEvent } from '$lib/types.js';
	import DatePicker from './DatePicker.svelte';

	interface Props { event: ParsedEvent }
	let { event }: Props = $props();

	let loading = $state(false);

	let name = $state(event.name);
	let participants = $state(event.participants.join(', '));
	let dates = $state(event.dates);
	let timeSlots = $state<Record<string, string[]>>(event.timeSlots ?? {});

	const times = ['morning', 'afternoon', 'evening'];

	function toggle(date: string, time: string) {
		const current = timeSlots[date] ?? [];
		timeSlots[date] = current.includes(time)
			? current.filter((t) => t !== time)
			: [...current, time];
	}

	function hasTime(date: string, time: string) {
		return (timeSlots[date] ?? []).includes(time);
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
				<label class="mb-2 block text-sm font-medium text-gray-600">Dates</label>
				<DatePicker bind:dates />
				<input type="hidden" name="dates" value={JSON.stringify(dates)} />
			</div>

			<div>
				<div class="mb-2 flex items-baseline justify-between">
					<span class="text-sm font-medium text-gray-600">Time slots <span class="font-normal text-gray-400">(optional)</span></span>
					{#if Object.values(timeSlots).some(v => v.length > 0)}
						<button type="button" onclick={() => timeSlots = {}} class="text-xs text-gray-400 hover:text-gray-600">Clear all</button>
					{/if}
				</div>
				<div class="space-y-2">
					{#each dates as date}
						{@const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
						<div class="flex items-center gap-3">
							<span class="w-28 text-sm text-gray-600">{label}</span>
							<div class="flex gap-1.5">
								{#each times as time}
									<button
										type="button"
										onclick={() => toggle(date, time)}
										class="rounded-lg px-3 py-1 text-xs font-medium border transition-colors {hasTime(date, time) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'}"
									>
										{time[0].toUpperCase() + time.slice(1)}
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
				<input type="hidden" name="timeSlots" value={JSON.stringify(timeSlots)} />
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
