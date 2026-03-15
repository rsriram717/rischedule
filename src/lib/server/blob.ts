import { put, list, del } from '@vercel/blob';
import { BLOB_READ_WRITE_TOKEN } from '$env/static/private';
import type { StoredEvent, StoredResponse } from '$lib/types.js';

const token = BLOB_READ_WRITE_TOKEN;

async function getBlobUrl(pathname: string): Promise<string | null> {
	const { blobs } = await list({ prefix: pathname, limit: 1, token });
	return blobs[0]?.url ?? null;
}

async function fetchBlob(url: string): Promise<Response> {
	return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
}

export async function createEvent(opts: {
	name: string;
	dates: string[];
	participants?: string[];
	timePreference?: string;
	timeSlots?: Record<string, string[]>;
}): Promise<string> {
	const code = crypto.randomUUID().slice(0, 8);
	const event: StoredEvent = {
		code,
		name: opts.name,
		dates: opts.dates,
		participants: opts.participants,
		timePreference: opts.timePreference,
		timeSlots: opts.timeSlots,
		createdAt: new Date().toISOString()
	};
	await put(`events/${code}.json`, JSON.stringify(event), {
		access: 'private',
		addRandomSuffix: false,
		allowOverwrite: true,
		token
	});
	return code;
}

export async function getEvent(code: string): Promise<StoredEvent | null> {
	const url = await getBlobUrl(`events/${code}.json`);
	if (!url) return null;
	const res = await fetchBlob(url);
	if (!res.ok) return null;
	return res.json();
}

export async function getResponses(code: string): Promise<StoredResponse[]> {
	const url = await getBlobUrl(`responses/${code}.json`);
	if (!url) return [];
	const res = await fetchBlob(url);
	if (!res.ok) return [];
	return res.json();
}

export async function addResponse(
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
		token
	});
}

export async function deleteEvent(code: string): Promise<void> {
	const eventUrl = await getBlobUrl(`events/${code}.json`);
	const responsesUrl = await getBlobUrl(`responses/${code}.json`);
	const toDelete = [eventUrl, responsesUrl].filter(Boolean) as string[];
	if (toDelete.length > 0) await del(toDelete, { token });
}

export function isExpired(event: StoredEvent): boolean {
	const today = new Date().toISOString().slice(0, 10);
	return event.dates.every((d) => d < today);
}
