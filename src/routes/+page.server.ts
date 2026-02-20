import { fail } from '@sveltejs/kit';
import { parseNaturalLanguage } from '$lib/server/ai.js';
import { createEvent } from '$lib/server/db.js';
import type { DateConstraints } from '$lib/types.js';

export const actions = {
	parse: async ({ request }) => {
		const formData = await request.formData();
		const input = formData.get('input') as string;

		if (!input?.trim()) return fail(400, { error: 'Please enter an event description' });

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

	create: async ({ request, url }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const participantsRaw = formData.get('participants') as string;
		const participants = participantsRaw
			? participantsRaw.split(',').map((p) => p.trim()).filter(Boolean)
			: [];
		const dates: string[] = JSON.parse(formData.get('dates') as string);
		const timePreference = formData.get('timePreference') as string;

		if (!name?.trim()) return fail(400, { error: 'Event name is required' });
		if (dates.length === 0) return fail(400, { error: 'At least one date is required' });

		try {
			const { code } = await createEvent({
				name,
				dates,
				timePreference: timePreference && timePreference !== 'any' ? timePreference : undefined
			});

			const shareUrl = `${url.origin}/respond/${code}`;
			return { created: { url: shareUrl, hit_id: code, name }, step: 'success' as const };
		} catch (e) {
			console.error('Create error:', e);
			return fail(500, { error: 'Failed to create event. Please try again.' });
		}
	}
};
