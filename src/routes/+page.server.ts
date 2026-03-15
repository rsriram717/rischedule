import { fail } from '@sveltejs/kit';
import { parseNaturalLanguage } from '$lib/server/ai.js';
import { createEvent } from '$lib/server/blob.js';
import type { DateConstraints } from '$lib/types.js';

export const actions = {
	parse: async ({ request }) => {
		const formData = await request.formData();
		const input = formData.get('input') as string;

		if (!input?.trim()) return fail(400, { error: 'Please enter an event description' });

		// Extract and validate date constraints
		const maxWeeksAhead = parseInt(formData.get('maxWeeksAhead') as string) || 2;
		const maxDateOptions = parseInt(formData.get('maxDateOptions') as string) || 10;

		const constraints: DateConstraints = {
			maxWeeksAhead: Math.max(1, Math.min(8, maxWeeksAhead)),
			maxDateOptions: Math.max(3, Math.min(30, maxDateOptions))
		};

		try {
			const parsed = await parseNaturalLanguage(input, constraints);
			return { parsed, step: 'preview' as const };
		} catch (e) {
			console.error('Parse error:', e);
			return fail(500, { error: 'Failed to parse your input. Try the manual form.' });
		}
	},

	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const dates: string[] = JSON.parse(formData.get('dates') as string);
		const timePreference = formData.get('timePreference') as string | null;
		const timeSlotsRaw = formData.get('timeSlots') as string | null;
		const timeSlots = timeSlotsRaw ? JSON.parse(timeSlotsRaw) as Record<string, string[]> : undefined;
		const participantsRaw = formData.get('participants') as string | null;
		const participants = participantsRaw
			? participantsRaw.split(',').map((p) => p.trim()).filter(Boolean)
			: [];

		if (!name?.trim()) return fail(400, { error: 'Event name is required' });
		if (dates.length === 0) return fail(400, { error: 'At least one date is required' });

		try {
			const code = await createEvent({
				name,
				dates,
				participants: participants.length > 0 ? participants : undefined,
				timePreference: timePreference || undefined,
				timeSlots: timeSlots && Object.keys(timeSlots).length > 0 ? timeSlots : undefined
			});

			return { created: { code, name }, step: 'success' as const };
		} catch (e) {
			console.error('Create error:', e);
			return fail(500, { error: 'Failed to create event. Please try again.' });
		}
	}
};
