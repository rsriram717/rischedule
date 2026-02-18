export interface ParsedEvent {
	name: string;
	participants: string[];
	dates: string[]; // ISO date strings (YYYY-MM-DD)
	timePreference?: string; // e.g. "morning", "afternoon", "evening", "any"
	description?: string;
}

export interface RoboHit {
	hit_id: string;
	task_description: string;
	distribution_mode: string;
	status: string;
	created_at: string;
	responses: RoboResponse[];
	links?: Record<string, string>;
}

export interface RoboResponse {
	participant_name: string;
	response_data: Record<string, unknown>;
	responded_at: string;
}

export interface EventSummary {
	hitId: string;
	name: string;
	description: string;
	responseCount: number;
	participantCount: number;
	createdAt: string;
	shareLink?: string;
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
