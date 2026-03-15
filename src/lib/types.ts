export interface ParsedEvent {
	name: string;
	participants: string[];
	dates: string[]; // ISO date strings (YYYY-MM-DD)
	timePreference?: string; // e.g. "morning", "afternoon", "evening", "any"
	timeSlots?: Record<string, string[]>; // { "YYYY-MM-DD": ["morning"|"afternoon"|"evening"] }
	description?: string;
}

export interface StoredEvent {
	code: string;
	name: string;
	dates: string[];
	participants?: string[];
	timePreference?: string;
	timeSlots?: Record<string, string[]>;
	createdAt: string;
}

/**
 * Returns the slot keys for a set of dates + optional per-date time slots.
 * Compound keys: "YYYY-MM-DD_evening"; bare date keys when no times for that date.
 */
export function getSlotKeys(dates: string[], timeSlots?: Record<string, string[]>): string[] {
	return dates.flatMap((date) => {
		const times = timeSlots?.[date];
		return times?.length ? times.map((t) => `${date}_${t}`) : [date];
	});
}

export interface StoredResponse {
	name: string;
	availability: Record<string, boolean>; // { "2026-03-15": true }
	submittedAt: string;
}

export interface TimeSlot {
	date: string;
	availableParticipants: string[];
	totalParticipants: number;
	score: number; // 0-1, ratio of available/total
}

export interface DateConstraints {
	maxWeeksAhead: number; // 1-8 weeks
	maxDateOptions: number; // 3-30 dates
}
