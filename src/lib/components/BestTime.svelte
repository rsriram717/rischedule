<script lang="ts">
	import type { TimeSlot } from '$lib/types.js';

	let { slot } = $props<{ slot: TimeSlot | null }>();

	function formatDate(iso: string) {
		return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

{#if slot && slot.availableParticipants.length > 0}
	<div class="rounded-2xl border border-amber-200 bg-amber-50 p-5">
		<div class="flex items-center gap-3">
			<div class="rounded-xl bg-amber-200 p-2.5 text-amber-700">
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
				</svg>
			</div>
			<div>
				<p class="text-sm font-medium text-amber-800">Best time</p>
				<p class="text-lg font-bold text-amber-900">{formatDate(slot.date)}</p>
				<p class="text-sm text-amber-700">
					{slot.availableParticipants.length} of {slot.totalParticipants} available
					({Math.round(slot.score * 100)}%)
				</p>
			</div>
		</div>
	</div>
{/if}
