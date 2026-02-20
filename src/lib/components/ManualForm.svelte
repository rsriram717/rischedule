<script lang="ts">
	import { enhance } from '$app/forms';

	let loading = $state(false);

	let name = $state('');
	let participants = $state('');
	let dateInputs = $state([todayStr()]);
	let timePreference = $state('any');

	function todayStr() {
		return new Date().toISOString().split('T')[0];
	}

	function addDate() {
		dateInputs = [...dateInputs, todayStr()];
	}

	function removeDate(index: number) {
		dateInputs = dateInputs.filter((_, i) => i !== index);
	}
</script>

<form method="POST" action="?/create" use:enhance={() => {
	loading = true;
	return async ({ update }) => {
		await update();
		loading = false;
	};
}} class="rounded-2xl border border-gray-200 bg-white p-6">
	<h3 class="mb-4 font-semibold text-gray-900">Create Event Manually</h3>

	<div class="space-y-4">
		<div>
			<label for="manual-name" class="mb-1 block text-sm font-medium text-gray-600">Event Name</label>
			<input
				id="manual-name"
				name="name"
				type="text"
				bind:value={name}
				required
				placeholder="Team lunch"
				class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
			/>
		</div>

		<div>
			<label for="manual-participants" class="mb-1 block text-sm font-medium text-gray-600">Participants (comma-separated)</label>
			<input
				id="manual-participants"
				name="participants"
				type="text"
				bind:value={participants}
				placeholder="Alice, Bob, Charlie"
				class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm font-medium text-gray-600">Dates</label>
			<div class="space-y-2">
				{#each dateInputs as _, i}
					<div class="flex gap-2">
						<input
							type="date"
							bind:value={dateInputs[i]}
							class="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
						/>
						{#if dateInputs.length > 1}
							<button type="button" onclick={() => removeDate(i)} class="text-gray-400 hover:text-red-500">&times;</button>
						{/if}
					</div>
				{/each}
			</div>
			<button type="button" onclick={addDate} class="mt-2 text-sm text-indigo-600 hover:text-indigo-800">+ Add date</button>
			<input type="hidden" name="dates" value={JSON.stringify(dateInputs)} />
		</div>

		<div>
			<label for="manual-time" class="mb-1 block text-sm font-medium text-gray-600">Time Preference</label>
			<select
				id="manual-time"
				name="timePreference"
				bind:value={timePreference}
				class="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
			>
				<option value="any">Any time</option>
				<option value="morning">Morning</option>
				<option value="afternoon">Afternoon</option>
				<option value="evening">Evening</option>
			</select>
		</div>
	</div>

	<button
		type="submit"
		disabled={!name.trim() || dateInputs.length === 0 || loading}
		class="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300"
	>
		{loading ? 'Creating...' : 'Create Event'}
	</button>
</form>
