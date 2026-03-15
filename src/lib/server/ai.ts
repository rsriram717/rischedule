import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import type { ParsedEvent, DateConstraints } from '$lib/types.js';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export async function parseNaturalLanguage(
	input: string,
	constraints?: DateConstraints
): Promise<ParsedEvent> {
	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];
	const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

	// Build constraint text for AI prompt
	const constraintText = constraints
		? `\n- Unless the user explicitly requests a specific time range, prefer dates within the next ${constraints.maxWeeksAhead} weeks\n- Suggest at most ${constraints.maxDateOptions} date options`
		: '';

	const message = await client.messages.create({
		model: 'claude-haiku-4-5-20251001',
		max_tokens: 1024,
		messages: [
			{
				role: 'user',
				content: `Parse this event scheduling request into structured JSON. Today is ${dayOfWeek}, ${todayStr}.

Input: "${input}"

Return ONLY valid JSON with this schema:
{
  "name": "event name (string)",
  "participants": ["list of participant names mentioned"],
  "dates": ["YYYY-MM-DD format, resolve relative dates like 'next Thursday' to actual dates"],
  "timePreference": "morning|afternoon|evening|any (optional, infer from context)",
  "timeSlots": {
    "YYYY-MM-DD": ["morning"|"afternoon"|"evening"]
    // only include dates where a specific time was mentioned for that date
    // omit the key entirely if no time was mentioned for that date
  },
  "description": "brief description if any extra context was given (optional)"
}

Rules:
- If no participants are mentioned, return an empty array
- If no specific dates mentioned, suggest the next 5 weekdays (Mon-Fri)
- For social, gaming, casual, or group hangout events (e.g. D&D, dinner, game night, party), prefer weekends (Sat/Sun) unless weekdays are explicitly requested
- "next week" means all 5 weekdays of the following week
- "this week" means all remaining weekdays of the current week
- "next Thursday" means the Thursday of NEXT week, not this week
- "this Thursday" means the Thursday of THIS week
- If the user specifies a time range (e.g. "3-5 weeks from now", "next month"), generate dates WITHIN that range — do not substitute closer dates
- Be generous with dates — when in doubt, include more options rather than fewer
- Always return at least one date
- Event name should be concise but descriptive${constraintText}`
			}
		]
	});

	const text = message.content[0].type === 'text' ? message.content[0].text : '';
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (!jsonMatch) throw new Error('Failed to parse AI response');

	const parsed = JSON.parse(jsonMatch[0]) as ParsedEvent;

	// Backfill timeSlots from event-wide timePreference if no per-date times were extracted
	if ((!parsed.timeSlots || Object.keys(parsed.timeSlots).length === 0) &&
		parsed.timePreference && parsed.timePreference !== 'any') {
		parsed.timeSlots = Object.fromEntries(
			parsed.dates.map((d) => [d, [parsed.timePreference!]])
		);
	}

	// Apply hard constraints if provided (post-processing filter)
	if (constraints) {
		// Calculate max date (today + maxWeeksAhead weeks)
		const maxDate = new Date(today);
		maxDate.setDate(maxDate.getDate() + constraints.maxWeeksAhead * 7);

		// Filter dates: within range, sorted chronologically, limited to maxDateOptions
		// Compare as YYYY-MM-DD strings to avoid timezone offset issues with Date objects
		const maxDateStr = maxDate.toISOString().split('T')[0];
		const filteredDates = parsed.dates
			.filter((date) => date >= todayStr && date <= maxDateStr)
			.sort()
			.slice(0, constraints.maxDateOptions);

		// Also filter timeSlots to only include kept dates
		const filteredTimeSlots = parsed.timeSlots
			? Object.fromEntries(
				Object.entries(parsed.timeSlots).filter(([d]) => filteredDates.includes(d))
			)
			: undefined;

		return { ...parsed, dates: filteredDates, timeSlots: filteredTimeSlots };
	}

	return parsed;
}
