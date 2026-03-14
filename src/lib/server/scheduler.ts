import type { TimeSlot, StoredResponse } from '$lib/types.js';

export function findBestTimes(responses: StoredResponse[], dates: string[]): TimeSlot[] {
	const slots: TimeSlot[] = dates.map((date) => {
		const available: string[] = [];

		for (const r of responses) {
			if (r.availability[date] === true) {
				available.push(r.name);
			}
		}

		return {
			date,
			availableParticipants: available,
			totalParticipants: responses.length,
			score: responses.length > 0 ? available.length / responses.length : 0
		};
	});

	return slots.sort((a, b) => b.score - a.score);
}
