// Load env vars before any imports that need them
import { readFileSync, existsSync } from 'fs';

function loadEnvFile(path: string): boolean {
	if (!existsSync(path)) return false;
	const content = readFileSync(path, 'utf-8');
	for (const line of content.split('\n')) {
		const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
		if (match) {
			const key = match[1].trim();
			const val = match[2].trim().replace(/^["']|["']$/g, '');
			if (!process.env[key]) process.env[key] = val;
		}
	}
	return true;
}

loadEnvFile('.env.local') || loadEnvFile('.env');

// ─── Imports ────────────────────────────────────────────────────────────────

import { put, list, del } from '@vercel/blob';
import Anthropic from '@anthropic-ai/sdk';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoredEvent {
	code: string;
	name: string;
	dates: string[];
	timePreference?: string;
	createdAt: string;
}

interface StoredResponse {
	name: string;
	availability: Record<string, boolean>;
	submittedAt: string;
}

interface TimeSlot {
	date: string;
	availableParticipants: string[];
	totalParticipants: number;
	score: number;
}

interface ParsedEvent {
	name: string;
	participants: string[];
	dates: string[];
	timePreference?: string;
	description?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;
const AI_KEY = process.env.ANTHROPIC_API_KEY!;

// ─── Inline blob helpers ─────────────────────────────────────────────────────

async function getBlobUrl(pathname: string): Promise<string | null> {
	const { blobs } = await list({ prefix: pathname, limit: 1, token: TOKEN });
	return blobs[0]?.url ?? null;
}

async function fetchBlob(url: string): Promise<Response> {
	return fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
}

async function createEvent(opts: {
	name: string;
	dates: string[];
	timePreference?: string;
}): Promise<string> {
	const code = crypto.randomUUID().slice(0, 8);
	const event: StoredEvent = {
		code,
		name: opts.name,
		dates: opts.dates,
		timePreference: opts.timePreference,
		createdAt: new Date().toISOString()
	};
	await put(`events/${code}.json`, JSON.stringify(event), {
		access: 'private',
		addRandomSuffix: false,
		allowOverwrite: true,
		token: TOKEN
	});
	return code;
}

async function getEvent(code: string): Promise<StoredEvent | null> {
	const url = await getBlobUrl(`events/${code}.json`);
	if (!url) return null;
	const res = await fetchBlob(url);
	if (!res.ok) return null;
	return res.json();
}

async function getResponses(code: string): Promise<StoredResponse[]> {
	const url = await getBlobUrl(`responses/${code}.json`);
	if (!url) return [];
	const res = await fetchBlob(url);
	if (!res.ok) return [];
	return res.json();
}

async function addResponse(
	code: string,
	resp: { name: string; availability: Record<string, boolean> }
): Promise<void> {
	const existing = await getResponses(code);
	const updated: StoredResponse[] = [
		...existing,
		{ name: resp.name, availability: resp.availability, submittedAt: new Date().toISOString() }
	];
	await put(`responses/${code}.json`, JSON.stringify(updated), {
		access: 'private',
		addRandomSuffix: false,
		allowOverwrite: true,
		token: TOKEN
	});
}

async function deleteEvent(code: string): Promise<void> {
	const eventUrl = await getBlobUrl(`events/${code}.json`);
	const responsesUrl = await getBlobUrl(`responses/${code}.json`);
	const toDelete = [eventUrl, responsesUrl].filter(Boolean) as string[];
	if (toDelete.length > 0) await del(toDelete, { token: TOKEN });
}

function isExpired(event: StoredEvent): boolean {
	const t = new Date().toISOString().slice(0, 10);
	return event.dates.every((d) => d < t);
}

// ─── Inline AI helper ─────────────────────────────────────────────────────────

async function parseNL(input: string): Promise<ParsedEvent> {
	const client = new Anthropic({ apiKey: AI_KEY });
	const todayDate = new Date();
	const todayStr = todayDate.toISOString().split('T')[0];
	const dayOfWeekStr = todayDate.toLocaleDateString('en-US', { weekday: 'long' });

	const message = await client.messages.create({
		model: 'claude-haiku-4-5-20251001',
		max_tokens: 1024,
		messages: [
			{
				role: 'user',
				content: `Parse this event scheduling request into structured JSON. Today is ${dayOfWeekStr}, ${todayStr}.

Input: "${input}"

Return ONLY valid JSON with this schema:
{
  "name": "event name (string)",
  "participants": ["list of participant names mentioned"],
  "dates": ["YYYY-MM-DD format, resolve relative dates like 'next Thursday' to actual dates"],
  "timePreference": "morning|afternoon|evening|any (optional, infer from context)",
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
- Event name should be concise but descriptive`
			}
		]
	});

	const text = message.content[0].type === 'text' ? message.content[0].text : '';
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (!jsonMatch) throw new Error('Failed to parse AI response');
	return JSON.parse(jsonMatch[0]) as ParsedEvent;
}

// ─── Inline scheduler ────────────────────────────────────────────────────────

function findBestTimes(responses: StoredResponse[], dates: string[]): TimeSlot[] {
	const slots: TimeSlot[] = dates.map((date) => {
		const available: string[] = [];
		for (const r of responses) {
			if (r.availability[date] === true) available.push(r.name);
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

// ─── Date utilities ───────────────────────────────────────────────────────────

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, n: number): string {
	const d = new Date(date + 'T12:00:00Z');
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

function dayOfWeek(date: string): number {
	return new Date(date + 'T12:00:00Z').getUTCDay();
}

function isWeekend(date: string): boolean {
	const dow = dayOfWeek(date);
	return dow === 0 || dow === 6;
}

function nextWeekday(targetDow: number): string {
	let d = addDays(today(), 1);
	while (dayOfWeek(d) !== targetDow) d = addDays(d, 1);
	return d;
}

// ─── Test infrastructure ──────────────────────────────────────────────────────

type Result = { name: string; passed: boolean; errors: string[] };
const results: Result[] = [];
const createdCodes = new Set<string>();

function assert(condition: boolean, message: string): void {
	if (!condition) throw new Error(message);
}

async function runScenario(name: string, fn: () => Promise<void>): Promise<void> {
	process.stdout.write(`  running: ${name}... `);
	try {
		await fn();
		results.push({ name, passed: true, errors: [] });
		console.log('PASS');
	} catch (e) {
		results.push({ name, passed: false, errors: [(e as Error).message] });
		console.log('FAIL');
		console.log(`    └─ ${(e as Error).message}`);
	}
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

async function scenario1_dnd(): Promise<void> {
	const parsed = await parseNL('dnd with aaron next tue-thu evening');

	assert(/dnd|d&d/i.test(parsed.name), `name "${parsed.name}" doesn't match /dnd|d&d/i`);
	assert(
		parsed.participants.some((p) => /aaron/i.test(p)),
		`participants ${JSON.stringify(parsed.participants)} missing "aaron"`
	);
	assert(parsed.dates.length === 3, `expected 3 dates, got ${parsed.dates.length}: ${parsed.dates}`);

	for (const d of parsed.dates) {
		const dow = dayOfWeek(d);
		assert(
			dow >= 2 && dow <= 4,
			`date ${d} is not Tue/Wed/Thu (dayOfWeek=${dow})`
		);
		assert(
			d <= addDays(today(), 14),
			`date ${d} is more than 14 days away`
		);
	}

	const code = await createEvent({ name: parsed.name, dates: parsed.dates, timePreference: parsed.timePreference });
	createdCodes.add(code);

	const avail: Record<string, boolean> = {};
	for (const d of parsed.dates) avail[d] = true;
	await addResponse(code, { name: 'Alice', availability: avail });
	await addResponse(code, { name: 'Bob', availability: { [parsed.dates[0]]: true, [parsed.dates[1]]: false, [parsed.dates[2]]: false } });

	const responses = await getResponses(code);
	assert(responses.length === 2, `expected 2 responses, got ${responses.length}`);

	const slots = findBestTimes(responses, parsed.dates);
	assert(
		slots[0].date === parsed.dates[0],
		`expected top slot to be ${parsed.dates[0]} (Tuesday), got ${slots[0].date}`
	);
	assert(
		Math.abs(slots[0].score - 1.0) < 0.001,
		`expected top slot score 1.0, got ${slots[0].score}`
	);
}

async function scenario2_movieNight(): Promise<void> {
	const parsed = await parseNL('movie night with pallavi one weekend night in the next 3 weeks');

	assert(/movie/i.test(parsed.name), `name "${parsed.name}" doesn't match /movie/i`);
	assert(
		parsed.participants.some((p) => /pallavi/i.test(p)),
		`participants ${JSON.stringify(parsed.participants)} missing "pallavi"`
	);
	assert(parsed.dates.length >= 1, `expected at least 1 date, got ${parsed.dates.length}`);

	for (const d of parsed.dates) {
		assert(isWeekend(d), `date ${d} is not a weekend (dayOfWeek=${dayOfWeek(d)})`);
		assert(
			d <= addDays(today(), 25),
			`date ${d} is more than 25 days away`
		);
	}

	const code = await createEvent({ name: parsed.name, dates: parsed.dates });
	createdCodes.add(code);

	const avail: Record<string, boolean> = {};
	for (let i = 0; i < parsed.dates.length; i++) avail[parsed.dates[i]] = i === 0;
	await addResponse(code, { name: 'Pallavi', availability: avail });

	const responses = await getResponses(code);
	const slots = findBestTimes(responses, parsed.dates);
	assert(
		slots[0].date === parsed.dates[0],
		`expected top slot ${parsed.dates[0]}, got ${slots[0].date}`
	);
	assert(
		Math.abs(slots[0].score - 1.0) < 0.001,
		`expected score 1.0, got ${slots[0].score}`
	);
}

async function scenario3_lunch(): Promise<void> {
	const parsed = await parseNL('lunch with the team this friday or next friday');

	assert(/lunch/i.test(parsed.name), `name "${parsed.name}" doesn't match /lunch/i`);
	assert(parsed.dates.length === 2, `expected 2 dates, got ${parsed.dates.length}: ${parsed.dates}`);

	for (const d of parsed.dates) {
		assert(dayOfWeek(d) === 5, `date ${d} is not a Friday (dayOfWeek=${dayOfWeek(d)})`);
	}

	// Verify second date is 7 days after first
	const gap = (new Date(parsed.dates[1] + 'T12:00:00Z').getTime() - new Date(parsed.dates[0] + 'T12:00:00Z').getTime()) / (1000 * 60 * 60 * 24);
	assert(gap === 7, `expected dates to be 7 days apart, got ${gap}`);

	const code = await createEvent({ name: parsed.name, dates: parsed.dates });
	createdCodes.add(code);

	await addResponse(code, { name: 'Alice', availability: { [parsed.dates[0]]: true, [parsed.dates[1]]: false } });
	await addResponse(code, { name: 'Bob', availability: { [parsed.dates[0]]: false, [parsed.dates[1]]: true } });

	const responses = await getResponses(code);
	const slots = findBestTimes(responses, parsed.dates);
	assert(
		Math.abs(slots[0].score - 0.5) < 0.001 && Math.abs(slots[1].score - 0.5) < 0.001,
		`expected tied scores of 0.5, got ${slots[0].score} and ${slots[1].score}`
	);
}

async function scenario4_birthday(): Promise<void> {
	const parsed = await parseNL('birthday drinks for sam, march 28 or 29');

	assert(
		/birthday|drinks/i.test(parsed.name),
		`name "${parsed.name}" doesn't match /birthday|drinks/i`
	);
	assert(
		parsed.participants.some((p) => /sam/i.test(p)),
		`participants ${JSON.stringify(parsed.participants)} missing "sam"`
	);
	assert(
		parsed.dates.includes('2026-03-28'),
		`dates ${JSON.stringify(parsed.dates)} missing "2026-03-28"`
	);
	assert(
		parsed.dates.includes('2026-03-29'),
		`dates ${JSON.stringify(parsed.dates)} missing "2026-03-29"`
	);
	assert(
		parsed.timePreference !== undefined && /evening/i.test(parsed.timePreference),
		`expected timePreference "evening", got "${parsed.timePreference}"`
	);

	const code = await createEvent({ name: parsed.name, dates: ['2026-03-28', '2026-03-29'], timePreference: parsed.timePreference });
	createdCodes.add(code);

	await addResponse(code, { name: 'Alice', availability: { '2026-03-28': true, '2026-03-29': true } });
	await addResponse(code, { name: 'Bob', availability: { '2026-03-28': true, '2026-03-29': false } });

	const responses = await getResponses(code);
	const slots = findBestTimes(responses, ['2026-03-28', '2026-03-29']);
	assert(slots[0].date === '2026-03-28', `expected top slot 2026-03-28, got ${slots[0].date}`);
	assert(Math.abs(slots[0].score - 1.0) < 0.001, `expected score 1.0, got ${slots[0].score}`);
	assert(slots[1].date === '2026-03-29', `expected second slot 2026-03-29, got ${slots[1].date}`);
	assert(Math.abs(slots[1].score - 0.5) < 0.001, `expected score 0.5, got ${slots[1].score}`);
}

async function scenario5_expired(): Promise<void> {
	const code = await createEvent({ name: 'Test Expired', dates: ['2024-01-01', '2024-01-02'] });
	createdCodes.add(code);

	const event = await getEvent(code);
	assert(event !== null, 'expected event to exist after creation');
	assert(isExpired(event!), 'expected event with past dates to be expired');

	await deleteEvent(code);
	createdCodes.delete(code); // already deleted

	const afterDelete = await getEvent(code);
	assert(afterDelete === null, 'expected event to be null after deletion');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	// Validate env
	if (!TOKEN) {
		console.error('Error: BLOB_READ_WRITE_TOKEN is not set. Check .env.local or .env');
		process.exit(1);
	}
	if (!AI_KEY) {
		console.error('Error: ANTHROPIC_API_KEY is not set. Check .env.local or .env');
		process.exit(1);
	}

	console.log('\n══════════════════════════════════════');
	console.log('  rischedule test scenarios');
	console.log('══════════════════════════════════════\n');

	try {
		await runScenario('dnd with aaron next tue-thu evening', scenario1_dnd);
		await runScenario('movie night with pallavi (weekend)', scenario2_movieNight);
		await runScenario('lunch this friday or next friday', scenario3_lunch);
		await runScenario('birthday drinks for sam', scenario4_birthday);
		await runScenario('expired event cleanup', scenario5_expired);
	} finally {
		if (createdCodes.size > 0) {
			console.log(`\n  cleaning up ${createdCodes.size} test event(s)...`);
			for (const code of createdCodes) {
				await deleteEvent(code).catch((e: Error) =>
					console.warn(`  cleanup warning: ${code}: ${e.message}`)
				);
			}
		}

		const passed = results.filter((r) => r.passed).length;
		const total = results.length;
		const cleaned = createdCodes.size; // codes remaining (already-deleted ones removed)
		const totalCreated = passed >= 4 ? 4 : passed; // approximate

		console.log('\n══════════════════════════════════════');
		for (const r of results) {
			const icon = r.passed ? 'PASS' : 'FAIL';
			console.log(`  ${icon}  ${r.name}`);
		}
		console.log(`\n  ${passed}/${total} passed  ·  cleaned up ${createdCodes.size + (passed === total ? 1 : 0)} test events`);
		console.log('══════════════════════════════════════\n');

		process.exit(results.every((r) => r.passed) ? 0 : 1);
	}
}

main();
