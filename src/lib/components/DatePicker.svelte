<script lang="ts">
	interface Props {
		dates: string[];
		minDate?: string;
	}

	let { dates = $bindable(), minDate }: Props = $props();

	const today = new Date().toISOString().split('T')[0];
	const floor = minDate ?? today;

	function getInitialView(): Date {
		const sorted = [...dates].sort();
		const ref = sorted[0] ?? today;
		const d = new Date(ref + 'T12:00:00');
		return new Date(d.getFullYear(), d.getMonth(), 1);
	}

	let viewYear = $state(getInitialView().getFullYear());
	let viewMonth = $state(getInitialView().getMonth());

	function prevMonth() {
		if (viewMonth === 0) { viewMonth = 11; viewYear -= 1; }
		else viewMonth -= 1;
	}

	function nextMonth() {
		if (viewMonth === 11) { viewMonth = 0; viewYear += 1; }
		else viewMonth += 1;
	}

	function toISO(y: number, m: number, d: number): string {
		return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
	}

	function toggleDate(iso: string) {
		if (dates.includes(iso)) {
			dates = dates.filter(d => d !== iso);
		} else {
			dates = [...dates, iso].sort();
		}
	}

	type Cell = { iso: string; day: number } | null;

	let cells = $derived.by((): Cell[] => {
		const firstDay = new Date(viewYear, viewMonth, 1).getDay();
		const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
		const result: Cell[] = Array(firstDay).fill(null);
		for (let d = 1; d <= daysInMonth; d++) {
			result.push({ iso: toISO(viewYear, viewMonth, d), day: d });
		}
		while (result.length % 7 !== 0) result.push(null);
		return result;
	});

	const monthLabel = $derived(
		new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
	);

	const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
</script>

<div class="select-none rounded-xl border border-gray-200 bg-white p-4">
	<!-- Month nav -->
	<div class="mb-3 flex items-center justify-between">
		<button
			type="button"
			onclick={prevMonth}
			class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
			aria-label="Previous month"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<span class="text-sm font-semibold text-gray-800">{monthLabel}</span>
		<button
			type="button"
			onclick={nextMonth}
			class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
			aria-label="Next month"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	</div>

	<!-- Day-of-week headers -->
	<div class="mb-1 grid grid-cols-7 text-center">
		{#each DOW as d}
			<div class="py-1 text-xs font-medium text-gray-400">{d}</div>
		{/each}
	</div>

	<!-- Calendar grid -->
	<div class="grid grid-cols-7 gap-y-0.5">
		{#each cells as cell}
			{#if cell === null}
				<div></div>
			{:else}
				{@const selected = dates.includes(cell.iso)}
				{@const past = cell.iso < floor}
				{@const isToday = cell.iso === today}
				<button
					type="button"
					onclick={() => !past && toggleDate(cell.iso)}
					disabled={past}
					class="
						relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors
						{selected
							? 'bg-indigo-600 font-semibold text-white hover:bg-indigo-700'
							: past
								? 'cursor-default text-gray-300'
								: 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'}
					"
				>
					{cell.day}
					{#if isToday && !selected}
						<span class="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-400"></span>
					{/if}
				</button>
			{/if}
		{/each}
	</div>

	<!-- Selected count -->
	<div class="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
		{#if dates.length === 0}
			No dates selected — click days above to add
		{:else}
			{dates.length} date{dates.length === 1 ? '' : 's'} selected
		{/if}
	</div>
</div>
