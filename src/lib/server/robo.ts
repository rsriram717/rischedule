import { ROBO_BEARER_TOKEN, ROBO_MCP_URL } from '$env/static/private';

async function rpc(method: string, params: Record<string, unknown> = {}) {
	const res = await fetch(ROBO_MCP_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json, text/event-stream',
			Authorization: `Bearer ${ROBO_BEARER_TOKEN}`
		},
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'tools/call',
			params: { name: method, arguments: params }
		})
	});

	if (!res.ok) {
		throw new Error(`Robo RPC error: ${res.status} ${await res.text()}`);
	}

	const raw = await res.text();

	// Response may be SSE format: "event: message\ndata: {...}"
	let jsonStr = raw;
	const dataMatch = raw.match(/^data: (.+)$/m);
	if (dataMatch) {
		jsonStr = dataMatch[1];
	}

	const json = JSON.parse(jsonStr);
	if (json.error) throw new Error(`Robo error: ${JSON.stringify(json.error)}`);

	const text: string = json.result?.content?.[0]?.text ?? '';
	return text;
}

export interface RoboHitRaw {
	id: string;
	type: string;
	distribution_mode: string;
	title: string;
	status: string;
	created_at: string;
	url: string;
	participants: string[];
	responded: string[];
	not_responded: string[];
	responses: Array<{
		name: string;
		data: Record<string, unknown>;
		at: string;
	}>;
}

export async function createHit(params: {
	task_description: string;
	distribution_mode: 'individual' | 'group' | 'open';
	hit_type?: string;
	participants?: string[];
	sender_name?: string;
	config?: Record<string, unknown>;
}): Promise<{ url: string; hit_id: string }> {
	const text = await rpc('create_hit', params);

	// Extract URL from response like "Created open HIT: https://robo.app/hit/vdtuiTZB\n..."
	const urlMatch = text.match(/https:\/\/robo\.app\/hit\/(\S+)/);
	if (!urlMatch) throw new Error('Could not find HIT URL in response');

	return { url: urlMatch[0], hit_id: urlMatch[1] };
}

export async function checkHitStatus(hitId?: string): Promise<RoboHitRaw[]> {
	const text = await rpc('check_hit_status', hitId ? { hit_id: hitId } : {});

	// The response text has a human-readable summary followed by a JSON array/object.
	// Scan line-by-line for the first line starting with [ or { that parses as valid JSON.
	const lines = text.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trimStart();
		if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
			const candidate = lines.slice(i).join('\n');
			try {
				const parsed = JSON.parse(candidate);
				return Array.isArray(parsed) ? parsed : [parsed];
			} catch {
				// not valid JSON from this point, keep scanning
			}
		}
	}

	return [];
}
