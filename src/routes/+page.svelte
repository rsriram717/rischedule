<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import NaturalInput from '$lib/components/NaturalInput.svelte';
	import ParsedPreview from '$lib/components/ParsedPreview.svelte';
	import ManualForm from '$lib/components/ManualForm.svelte';

	let { form } = $props();

	let showManual = $state(false);
	let copied = $state(false);
	let searchCode = $state('');
	let searchError = $state('');
	let myEvents = $state<Array<{ code: string; name: string; createdAt: string }>>([]);

	onMount(() => {
		const stored = localStorage.getItem('rischedule_events');
		if (stored) {
			try {
				myEvents = JSON.parse(stored);
			} catch {}
		}
	});

	function saveEvent(code: string, name: string) {
		const event = { code, name, createdAt: new Date().toISOString() };
		myEvents = [event, ...myEvents.filter((e) => e.code !== code)];
		localStorage.setItem('rischedule_events', JSON.stringify(myEvents));
	}

	function removeEvent(code: string) {
		myEvents = myEvents.filter((e) => e.code !== code);
		localStorage.setItem('rischedule_events', JSON.stringify(myEvents));
	}

	function copyLink(link: string) {
		navigator.clipboard.writeText(link);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function lookupEvent() {
		const code = searchCode.trim();
		if (!code) {
			searchError = 'Please enter an event code';
			return;
		}
		searchError = '';
		goto(`/${code}`);
	}

	// Save newly created event to localStorage
	$effect(() => {
		if (form?.step === 'success' && form.created?.hit_id) {
			const name = form.created.name || 'My Event';
			saveEvent(form.created.hit_id, name);
		}
	});
</script>

<div class="space-y-8">
	<!-- Success state -->
	{#if form?.step === 'success' && form.created}
		<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
			<div class="mb-3 flex items-center gap-2">
				<div class="rounded-lg bg-emerald-200 p-1.5 text-emerald-700">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h2 class="font-semibold text-emerald-900">Event Created!</h2>
			</div>

			<p class="mb-4 text-sm text-emerald-800">
				Share this link with participants so they can mark their availability:
			</p>

			{#if form.created.url}
				<div class="flex items-center gap-2 rounded-lg bg-white p-3 border border-emerald-200">
					<code class="flex-1 truncate text-sm text-gray-700">{form.created.url}</code>
					<button
						onclick={() => copyLink(form!.created!.url)}
						class="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
					>
						{copied ? 'Copied!' : 'Copy'}
					</button>
				</div>
			{/if}

			{#if form.created.hit_id}
				<p class="mt-3 text-sm text-emerald-700">
					Event code: <code class="rounded bg-emerald-100 px-2 py-0.5 font-mono font-semibold">{form.created.hit_id}</code>
					&mdash; <a href="/{form.created.hit_id}?organizer=1" class="underline">view results</a>
				</p>
			{/if}

			<button
				onclick={() => goto('/')}
				class="mt-4 text-sm text-emerald-700 underline hover:text-emerald-900"
			>
				Create another event
			</button>
		</div>
	{:else}
		<!-- NL Input -->
		<section>
			<h1 class="mb-2 text-2xl font-bold text-gray-900">Schedule something</h1>
			<p class="mb-4 text-gray-500">Describe your event in natural language</p>
			<NaturalInput />

			{#if form?.error}
				<p class="mt-2 text-sm text-red-600">{form.error}</p>
			{/if}

			<button
				onclick={() => (showManual = !showManual)}
				class="mt-3 text-sm text-gray-500 hover:text-indigo-600"
			>
				{showManual ? 'Hide manual form' : 'Or create manually'}
			</button>
		</section>

		<!-- Parsed preview -->
		{#if form?.step === 'preview' && form.parsed}
			<ParsedPreview event={form.parsed} />
		{/if}

		<!-- Manual form -->
		{#if showManual}
			<ManualForm />
		{/if}
	{/if}

	<!-- Lookup event (always visible) -->
	<section>
		<h2 class="mb-3 text-lg font-semibold text-gray-900">Look up an event</h2>
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={searchCode}
				placeholder="Enter event code (e.g. C1QlF8qn)"
				onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && lookupEvent()}
				class="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none"
			/>
			<button
				onclick={lookupEvent}
				class="rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
			>
				View
			</button>
		</div>
		{#if searchError}
			<p class="mt-2 text-sm text-red-600">{searchError}</p>
		{/if}
	</section>

	<!-- My events (localStorage) -->
	{#if myEvents.length > 0}
		<section>
			<h2 class="mb-3 text-lg font-semibold text-gray-900">My Events</h2>
			<div class="space-y-2">
				{#each myEvents as event}
					<div class="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
						<a href="/{event.code}" class="min-w-0 flex-1">
							<span class="font-medium text-gray-900">{event.name}</span>
							<span class="ml-2 rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">{event.code}</span>
						</a>
						<button
							onclick={() => removeEvent(event.code)}
							class="ml-3 text-xs text-gray-400 hover:text-red-500"
						>
							remove
						</button>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>
