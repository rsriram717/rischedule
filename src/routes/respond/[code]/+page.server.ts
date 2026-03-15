import { error, fail } from '@sveltejs/kit';
import { getEvent, addResponse, isExpired } from '$lib/server/blob.js';
import { getSlotKeys } from '$lib/types.js';

export async function load({ params }) {
	const event = await getEvent(params.code);

	if (!event || isExpired(event)) {
		throw error(404, 'Event not found or has expired');
	}

	return { event };
}

export const actions = {
	respond: async ({ params, request }) => {
		const event = await getEvent(params.code);
		if (!event || isExpired(event)) {
			return fail(404, { error: 'Event not found or has expired' });
		}

		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();

		if (!name) return fail(400, { error: 'Your name is required' });

		const slotKeys = getSlotKeys(event.dates, event.timeSlots);
		const availability: Record<string, boolean> = {};
		for (const key of slotKeys) {
			availability[key] = formData.get(`date_${key}`) === 'on';
		}

		await addResponse(params.code, { name, availability });

		return { success: true, code: params.code };
	}
};
