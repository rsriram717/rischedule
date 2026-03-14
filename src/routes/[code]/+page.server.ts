import { error } from '@sveltejs/kit';
import { getEvent, getResponses, deleteEvent, isExpired } from '$lib/server/blob.js';
import { findBestTimes } from '$lib/server/scheduler.js';

export async function load({ params }) {
	const event = await getEvent(params.code);

	if (!event) {
		throw error(404, 'Event not found');
	}

	if (isExpired(event)) {
		await deleteEvent(params.code);
		throw error(404, 'Event has expired');
	}

	const storedResponses = await getResponses(params.code);

	// Map to view shape expected by components
	const responses = storedResponses.map((r) => ({
		participant_name: r.name,
		response_data: r.availability,
		responded_at: r.submittedAt
	}));

	const slots = findBestTimes(storedResponses, event.dates);
	const bestSlot = slots.length > 0 && slots[0].availableParticipants.length > 0 ? slots[0] : null;

	return {
		code: params.code,
		name: event.name,
		responses,
		slots,
		bestSlot,
		shareLink: `/respond/${params.code}`,
		createdAt: event.createdAt
	};
}
