import type { TimeSlot, RoboResponse } from '$lib/types.js';

export function findBestTimes(responses: RoboResponse[], dates: string[]): TimeSlot[] {
	const slots: TimeSlot[] = dates.map((date) => {
		const available: string[] = [];

		for (const r of responses) {
			const data = r.response_data;
			if (isAvailableForDate(data, date)) {
				available.push(r.participant_name);
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

function isAvailableForDate(data: Record<string, unknown>, date: string): boolean {
	// Format 1: { available_slots: [{ date: "2026-02-19", time: "all-day" }] }
	if (Array.isArray(data.available_slots)) {
		return data.available_slots.some(
			(s: Record<string, unknown>) => s.date === date
		);
	}

	// Format 2: direct date keys { "2026-02-19": true }
	if (data[date] === true || data[date] === 'available' || data[date] === 'yes') {
		return true;
	}

	// Format 3: nested availability object
	if (typeof data.availability === 'object' && data.availability !== null) {
		const avail = data.availability as Record<string, unknown>;
		if (avail[date] === true || avail[date] === 'available' || avail[date] === 'yes') {
			return true;
		}
	}

	return false;
}

export function extractDatesFromDescription(description: string): string[] {
	const datePattern = /\d{4}-\d{2}-\d{2}/g;
	return description.match(datePattern) || [];
}

export function parseEventName(taskDescription: string): string {
	const match = taskDescription.match(/^\[(.+?)\]/);
	return match ? match[1] : taskDescription.slice(0, 50);
}
