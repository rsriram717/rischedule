<script lang="ts">
	import { enhance } from '$app/forms';
	import { getSlotKeys } from '$lib/types.js';

	let { data, form } = $props();

	const knownParticipants = data.event.participants ?? [];
	let selectedName = $state(knownParticipants.length > 0 ? knownParticipants[0] : '');
	let otherName = $state('');
	let isOther = $derived(knownParticipants.length === 0 || selectedName === '__other__');

	const slotKeys = $derived(getSlotKeys(data.event.dates, data.event.timeSlots));
	const hasTimeSlots = $derived(data.event.timeSlots && Object.keys(data.event.timeSlots).length > 0);

	let mode = $state<'all' | 'individual' | null>(null);

	function formatDate(dateStr: string) {
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
	}

	function slotLabel(key: string) {
		const [, timePart] = key.split('_');
		return timePart ? timePart[0].toUpperCase() + timePart.slice(1) : 'Available (whole day)';
	}

	// Group slot keys by date for display
	const slotsByDate = $derived(
		data.event.dates.map((date: string) => ({
			date,
			keys: slotKeys.filter((k: string) => k === date || k.startsWith(date + '_'))
		}))
	);
</script>

<svelte:head>
	<title>{data.event.name} — rischedule</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<a href="/" class="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Back
		</a>
		<h1 class="text-2xl font-bold text-gray-900">{data.event.name}</h1>
		{#if data.event.timePreference && data.event.timePreference !== 'any'}
			<p class="mt-1 text-sm text-gray-500">Preferred time: {data.event.timePreference}</p>
		{/if}
	</div>

	{#if form?.success}
		<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
			<div class="mb-3 flex items-center gap-2">
				<div class="rounded-lg bg-emerald-200 p-1.5 text-emerald-700">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h2 class="font-semibold text-emerald-900">Availability submitted!</h2>
			</div>
			<p class="mb-4 text-sm text-emerald-800">Thanks for responding. You can view the results below.</p>
			<a
				href="/{form.code}"
				class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
			>
				View results
			</a>
		</div>
	{:else}
		<div class="rounded-2xl border border-gray-200 bg-white p-6">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">Mark your availability</h2>

			<form method="POST" action="?/respond" use:enhance>
				<!-- Name picker -->
				<div class="mb-5">
					<p class="mb-2 text-sm font-medium text-gray-700">Who are you?</p>

					{#if knownParticipants.length > 0}
						<div class="space-y-2">
							{#each knownParticipants as participant}
								<label class="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors {selectedName === participant ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}">
									<input
										type="radio"
										bind:group={selectedName}
										value={participant}
										class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
									/>
									<span class="text-sm text-gray-900">{participant}</span>
								</label>
							{/each}

							<label class="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors {selectedName === '__other__' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}">
								<input
									type="radio"
									bind:group={selectedName}
									value="__other__"
									class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
								/>
								<span class="text-sm text-gray-500">Other</span>
							</label>
						</div>

						{#if isOther}
							<input
								type="text"
								bind:value={otherName}
								placeholder="Enter your name"
								class="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none"
							/>
						{/if}
					{:else}
						<input
							type="text"
							bind:value={otherName}
							placeholder="Enter your name"
							class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none"
						/>
					{/if}

					<input type="hidden" name="name" value={isOther ? otherName : selectedName} />
				</div>

				<!-- Step 1: quick pick (only shown when there are time slots) -->
				{#if hasTimeSlots}
					<fieldset class="mb-5">
						<legend class="mb-3 text-sm font-medium text-gray-700">Your availability</legend>
						<!-- Slot summary so users know what they're committing to -->
						<div class="mb-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-1">
							{#each slotsByDate as { date, keys }}
								<div class="flex items-baseline gap-2 text-sm">
									<span class="font-medium text-gray-700">{formatDate(date)}</span>
									<span class="text-gray-500">{keys.map(k => slotLabel(k)).join(', ')}</span>
								</div>
							{/each}
						</div>
						<div class="space-y-2">
							<label class="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors {mode === 'all' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}">
								<input
									type="radio"
									name="availMode"
									value="all"
									bind:group={mode}
									class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
								/>
								<span class="text-sm text-gray-900">I'm free on all of these</span>
							</label>
							<label class="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors {mode === 'individual' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}">
								<input
									type="radio"
									name="availMode"
									value="individual"
									bind:group={mode}
									class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
								/>
								<span class="text-sm text-gray-900">Let me pick individually</span>
							</label>
						</div>
					</fieldset>
				{/if}

				<!-- Hidden inputs when "all" is selected -->
				{#if hasTimeSlots && mode === 'all'}
					{#each slotKeys as key}
						<input type="hidden" name="date_{key}" value="on" />
					{/each}
				{/if}

				<!-- Per-slot checkboxes -->
				{#if !hasTimeSlots || mode === 'individual'}
					<fieldset class="mb-6">
						<legend class="mb-3 text-sm font-medium text-gray-700">Which dates work for you?</legend>
						{#if hasTimeSlots}
							<!-- Grouped by date with time slot labels -->
							<div class="space-y-4">
								{#each slotsByDate as { date, keys }}
									<div>
										<p class="mb-1.5 text-sm font-medium text-gray-700">{formatDate(date)}</p>
										<div class="space-y-1.5">
											{#each keys as key}
												<label class="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50/50">
													<input
														type="checkbox"
														name="date_{key}"
														class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
													/>
													<span class="text-sm text-gray-900">{slotLabel(key)}</span>
												</label>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<!-- Flat list for whole-day events -->
							<div class="space-y-2">
								{#each data.event.dates as date}
									<label class="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50/50">
										<input
											type="checkbox"
											name="date_{date}"
											class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
										/>
										<span class="text-sm text-gray-900">{formatDate(date)}</span>
									</label>
								{/each}
							</div>
						{/if}
					</fieldset>
				{/if}

				{#if form?.error}
					<p class="mb-3 text-sm text-red-600">{form.error}</p>
				{/if}

				<button
					type="submit"
					class="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700"
				>
					Submit availability
				</button>
			</form>
		</div>
	{/if}
</div>
