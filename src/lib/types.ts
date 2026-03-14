export interface ParsedEvent {
	name: string;
	participants: string[];
	dates: string[]; // ISO date strings (YYYY-MM-DD)
	timePreference?: string; // e.g. "morning", "afternoon", "evening", "any"
	description?: string;
}

export interface StoredEvent {
	code: string;
	name: string;
	dates: string[];
	participants?: string[];
	timePreference?: string;
	createdAt: string;
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
