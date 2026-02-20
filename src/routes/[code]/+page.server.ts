import { error } from '@sveltejs/kit';
import { getEvent } from '$lib/server/db.js';
import { findBestTimes } from '$lib/server/scheduler.js';

export async function load({ params, url }) {
	const event = await getEvent(params.code);

	if (!event) {
		throw error(404, 'Event not found');
	}

	const slots = event.dates.length > 0 ? findBestTimes(event.responses, event.dates) : [];

	const bestSlot =
		slots.length > 0 && slots[0].availableParticipants.length > 0 ? slots[0] : null;

	return {
		code: params.code,
		name: event.name,
		responses: event.responses,
		slots,
		bestSlot,
		shareLink: `${url.origin}/respond/${params.code}`,
		createdAt: event.createdAt
	};
}
