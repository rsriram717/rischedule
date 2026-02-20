import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { RoboResponse } from '$lib/types.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function generateCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
	return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createEvent(params: {
	name: string;
	dates: string[];
	timePreference?: string;
}): Promise<{ code: string }> {
	const code = generateCode();

	const { error } = await supabase.from('events').insert({
		code,
		name: params.name,
		dates: params.dates,
		time_pref: params.timePreference || null
	});

	if (error) throw new Error(`Failed to create event: ${error.message}`);
	return { code };
}

export async function getEvent(code: string): Promise<{
	name: string;
	dates: string[];
	timePref: string | null;
	createdAt: string;
	responses: RoboResponse[];
} | null> {
	const { data: event, error: eventError } = await supabase
		.from('events')
		.select('*')
		.eq('code', code)
		.single();

	if (eventError || !event) return null;

	const { data: rows, error: responsesError } = await supabase
		.from('responses')
		.select('*')
		.eq('event_code', code)
		.order('responded_at', { ascending: true });

	if (responsesError) throw new Error(`Failed to load responses: ${responsesError.message}`);

	const responses: RoboResponse[] = (rows ?? []).map((r) => ({
		participant_name: r.participant_name,
		response_data: r.response_data,
		responded_at: r.responded_at
	}));

	return {
		name: event.name,
		dates: event.dates,
		timePref: event.time_pref,
		createdAt: event.created_at,
		responses
	};
}

export async function submitResponse(params: {
	eventCode: string;
	participantName: string;
	responseData: Record<string, boolean>;
}): Promise<void> {
	const { error } = await supabase.from('responses').upsert(
		{
			event_code: params.eventCode,
			participant_name: params.participantName,
			response_data: params.responseData,
			responded_at: new Date().toISOString()
		},
		{ onConflict: 'event_code,participant_name' }
	);

	if (error) throw new Error(`Failed to submit response: ${error.message}`);
}
