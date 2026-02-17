import { fail } from '@sveltejs/kit';
import { parseNaturalLanguage } from '$lib/server/ai.js';
import { createHit } from '$lib/server/robo.js';
import { SENDER_NAME } from '$env/static/private';

export const actions = {
	parse: async ({ request }) => {
		const formData = await request.formData();
		const input = formData.get('input') as string;

		if (!input?.trim()) return fail(400, { error: 'Please enter an event description' });

		try {
			const parsed = await parseNaturalLanguage(input);
			return { parsed, step: 'preview' as const };
		} catch (e) {
			console.error('Parse error:', e);
			return fail(500, { error: 'Failed to parse your input. Try the manual form.' });
		}
	},

	create: async ({ request }) => {
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

		const taskDescription = `[${name}] Available dates: ${dates.join(', ')}${timePreference && timePreference !== 'any' ? `. Preferred time: ${timePreference}` : ''}`;

		try {
			const result = await createHit({
				task_description: taskDescription,
				distribution_mode: participants.length > 0 ? 'group' : 'open',
				hit_type: 'availability',
				participants: participants.length > 0 ? participants : undefined,
				sender_name: SENDER_NAME,
				config: {
					date_options: dates
				}
			});

			return { created: { ...result, name }, step: 'success' as const };
		} catch (e) {
			console.error('Create error:', e);
			return fail(500, { error: 'Failed to create event. Please try again.' });
		}
	}
};
