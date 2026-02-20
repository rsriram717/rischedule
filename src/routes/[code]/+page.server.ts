import { error } from '@sveltejs/kit';
import { checkHitStatus } from '$lib/server/robo.js';
import { findBestTimes, extractDatesFromDescription, parseEventName } from '$lib/server/scheduler.js';
import type { RoboResponse } from '$lib/types.js';

export async function load({ params }) {
	try {
		const hits = await checkHitStatus(params.code);

		if (!hits || hits.length === 0) {
			throw error(404, 'Event not found');
		}

		const hit = hits[0];
		const name = parseEventName(hit.title);
		const dates = extractDatesFromDescription(hit.title);

		// Map Robo response format to our format
		const responses: RoboResponse[] = hit.responses.map((r) => ({
			participant_name: r.name,
			response_data: r.data,
			responded_at: r.at
		}));

		const slots = dates.length > 0 ? findBestTimes(responses, dates) : [];

		const bestSlot =
			slots.length > 0 && slots[0].availableParticipants.length > 0 ? slots[0] : null;

		return {
			code: params.code,
			name,
			description: hit.title,
			responses,
			slots,
			bestSlot,
			shareLink: hit.url,
			createdAt: hit.created_at
		};
	} catch (e: unknown) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		console.error('Failed to load event:', e);
		throw error(404, 'Event not found');
	}
}
