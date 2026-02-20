import { error, fail } from '@sveltejs/kit';
import { getEvent, submitResponse } from '$lib/server/db.js';

export async function load({ params }) {
	const event = await getEvent(params.code);

	if (!event) {
		throw error(404, 'Event not found');
	}

	return {
		code: params.code,
		name: event.name,
		dates: event.dates,
		timePref: event.timePref
	};
}

export const actions = {
	submit: async ({ request, params }) => {
		const formData = await request.formData();
		const participantName = (formData.get('name') as string)?.trim();

		if (!participantName) {
			return fail(400, { error: 'Please enter your name' });
		}

		// Fetch the event to get the canonical date list
		const event = await getEvent(params.code);
		if (!event) throw error(404, 'Event not found');

		// Build response_data: { "2026-02-20": true, "2026-02-21": false, ... }
		const responseData: Record<string, boolean> = {};
		for (const date of event.dates) {
			responseData[date] = formData.get(date) === 'on';
		}

		try {
			await submitResponse({
				eventCode: params.code,
				participantName,
				responseData
			});
			return { submitted: true, participantName };
		} catch (e) {
			console.error('Submit error:', e);
			return fail(500, { error: 'Failed to save your response. Please try again.' });
		}
	}
};
