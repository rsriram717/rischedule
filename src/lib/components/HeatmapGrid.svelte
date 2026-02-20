<script lang="ts">
	import type { TimeSlot } from '$lib/types.js';

	interface Props { slots: TimeSlot[]; participants?: string[] }
	let { slots, participants = [] }: Props = $props();

	function formatDate(iso: string) {
		return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function cellColor(isAvailable: boolean, isBestDate: boolean) {
		if (isBestDate && isAvailable) return 'bg-amber-200 border-amber-300';
		if (isAvailable) return 'bg-emerald-200 border-emerald-300';
		return 'bg-gray-100 border-gray-200';
	}

	const bestDate = $derived(slots.length > 0 ? slots[0].date : null);
	const sortedSlots = $derived([...slots].sort((a, b) => a.date.localeCompare(b.date)));
	const allParticipants = $derived(
		participants.length > 0
			? participants
			: [...new Set(slots.flatMap((s) => s.availableParticipants))]
	);
</script>

{#if sortedSlots.length === 0}
	<p class="text-center text-sm text-gray-500">No date information available yet.</p>
{:else}
	<div class="overflow-x-auto">
		<div class="inline-grid gap-1" style="grid-template-columns: auto repeat({sortedSlots.length}, minmax(5rem, 1fr))">
			<!-- Header row -->
			<div class="p-2"></div>
			{#each sortedSlots as slot}
				<div class="rounded-t-lg p-2 text-center text-xs font-medium text-gray-600 {slot.date === bestDate ? 'bg-amber-50' : ''}">
					{formatDate(slot.date)}
				</div>
			{/each}

			<!-- Participant rows -->
			{#each allParticipants as participant}
				<div class="flex items-center p-2 text-sm text-gray-700 truncate max-w-[8rem]">
					{participant}
				</div>
				{#each sortedSlots as slot}
					{@const isAvailable = slot.availableParticipants.includes(participant)}
					{@const isBest = slot.date === bestDate}
					<div class="rounded border p-2 text-center text-xs {cellColor(isAvailable, isBest)}">
						{isAvailable ? '✓' : '—'}
					</div>
				{/each}
			{/each}

			<!-- Summary row -->
			<div class="flex items-center p-2 text-sm font-medium text-gray-700">Total</div>
			{#each sortedSlots as slot}
				{@const isBest = slot.date === bestDate}
				<div class="rounded border p-2 text-center text-sm font-semibold {isBest ? 'bg-amber-200 border-amber-300 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-700'}">
					{slot.availableParticipants.length}/{slot.totalParticipants}
				</div>
			{/each}
		</div>
	</div>
{/if}
