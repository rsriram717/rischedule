<script lang="ts">
	import { enhance } from '$app/forms';

	let input = $state('');
	let loading = $state(false);
	let showAdvanced = $state(false);
	let maxWeeksAhead = $state(2);
	let maxDateOptions = $state(10);
	let isDraggingWeeks = $state(false);
	let isDraggingDates = $state(false);
</script>

<form method="POST" action="?/parse" use:enhance={() => {
	loading = true;
	return async ({ update, result }) => {
		await update();
		loading = false;
		if (result.type === 'success') {
			input = '';
		}
	};
}}>
	<div class="space-y-3">
		<div class="relative flex items-center">
			<input
				name="input"
				type="text"
				bind:value={input}
				placeholder="e.g. Carwash with Matt, next Thu or Fri"
				class="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 pr-24 text-lg shadow-sm transition-shadow focus:border-indigo-400 focus:shadow-md focus:outline-none"
				disabled={loading}
			/>
			<div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
				<button
					type="button"
					onclick={() => showAdvanced = !showAdvanced}
					disabled={loading}
					class="rounded-xl bg-gray-100 p-2.5 text-gray-600 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed {showAdvanced ? 'bg-indigo-100 text-indigo-600' : ''}"
					aria-label="Advanced date options"
					aria-pressed={showAdvanced}
				>
					<svg class="h-5 w-5 transition-transform {showAdvanced ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</button>
				<button
					type="submit"
					disabled={!input.trim() || loading}
					class="rounded-xl bg-indigo-600 p-2.5 text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
		</div>

		{#if showAdvanced}
			<div class="animate-slideDown rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4 space-y-4 shadow-sm {loading ? 'opacity-50 pointer-events-none' : ''}">
				<div class="flex items-center justify-between">
					<div class="text-sm font-medium text-gray-700">Advanced Options</div>
					{#if loading}
						<span class="text-xs text-gray-500">Parsing...</span>
					{/if}
				</div>

				<div class="space-y-2">
					<label for="maxWeeksAhead" class="flex items-center justify-between text-sm text-gray-600">
						<span>Look ahead</span>
						<span class="font-medium text-indigo-600 transition-all {isDraggingWeeks ? 'scale-110 text-lg' : ''}">{maxWeeksAhead} {maxWeeksAhead === 1 ? 'week' : 'weeks'}</span>
					</label>
					<input
						id="maxWeeksAhead"
						type="range"
						bind:value={maxWeeksAhead}
						onpointerdown={() => isDraggingWeeks = true}
						onpointerup={() => isDraggingWeeks = false}
						disabled={loading}
						min="1"
						max="8"
						class="w-full accent-indigo-600 cursor-pointer transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed {isDraggingWeeks ? 'scale-105' : ''}"
					/>
				</div>

				<div class="space-y-2">
					<label for="maxDateOptions" class="flex items-center justify-between text-sm text-gray-600">
						<span>Max date options</span>
						<span class="font-medium text-indigo-600 transition-all {isDraggingDates ? 'scale-110 text-lg' : ''}">{maxDateOptions}</span>
					</label>
					<input
						id="maxDateOptions"
						type="range"
						bind:value={maxDateOptions}
						onpointerdown={() => isDraggingDates = true}
						onpointerup={() => isDraggingDates = false}
						disabled={loading}
						min="3"
						max="30"
						class="w-full accent-indigo-600 cursor-pointer transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed {isDraggingDates ? 'scale-105' : ''}"
					/>
				</div>

				<button
					type="button"
					onclick={() => { maxWeeksAhead = 2; maxDateOptions = 10; }}
					disabled={loading}
					class="text-sm text-indigo-600 hover:text-indigo-700 transition-all hover:underline active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Reset to defaults
				</button>
			</div>
		{/if}

		<!-- Hidden inputs to pass constraints to server -->
		<input type="hidden" name="maxWeeksAhead" value={maxWeeksAhead} />
		<input type="hidden" name="maxDateOptions" value={maxDateOptions} />
	</div>
</form>

<style>
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-slideDown {
		animation: slideDown 0.2s ease-out;
	}

	/* Custom range slider styling */
	input[type="range"]::-webkit-slider-thumb {
		transition: transform 0.15s ease;
	}

	input[type="range"]:active::-webkit-slider-thumb {
		transform: scale(1.3);
	}

	input[type="range"]::-moz-range-thumb {
		transition: transform 0.15s ease;
	}

	input[type="range"]:active::-moz-range-thumb {
		transform: scale(1.3);
	}
</style>
