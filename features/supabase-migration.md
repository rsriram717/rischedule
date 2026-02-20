# Feature: Replace Robo with Supabase

## Why

The current Robo integration ties all events to a single account and bearer token (`SENDER_NAME`, `ROBO_BEARER_TOKEN`). Every event created through the app appears to come from the owner's Robo account. This makes the app unsuitable for public use — all participant links go through Robo's infrastructure under one identity, and there are no multi-tenant boundaries.

Replacing Robo with Supabase + a self-hosted respond page makes the app fully self-contained and public-safe.

## What Robo currently does (scope of replacement)

| Robo responsibility | Replacement |
|---|---|
| Store event (name, dates, participants) | `events` table in Supabase |
| Generate a shareable HIT link | `/respond/[code]` route on our own domain |
| Collect participant availability | Our own form at that route |
| Return responses via `check_hit_status` | `responses` table query |

## Database schema

```sql
CREATE TABLE events (
  code       TEXT PRIMARY KEY,          -- random 8-char ID
  name       TEXT NOT NULL,
  dates      TEXT[] NOT NULL,           -- ['2026-02-20', '2026-02-21', ...]
  time_pref  TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE responses (
  id               SERIAL PRIMARY KEY,
  event_code       TEXT NOT NULL REFERENCES events(code),
  participant_name TEXT NOT NULL,
  response_data    JSONB NOT NULL,      -- { "2026-02-20": true, "2026-02-21": false }
  responded_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_code, participant_name)  -- allows re-submission via upsert
);
```

## Files to create / modify

**New:**
- `src/lib/server/db.ts` — `createEvent`, `getEvent`, `submitResponse` using `@supabase/supabase-js`
- `src/routes/respond/[code]/+page.svelte` — availability form (name input + date checkboxes)
- `src/routes/respond/[code]/+page.server.ts` — load event dates, handle form submit action
- `supabase/schema.sql` — SQL to run in Supabase SQL editor

**Modified:**
- `src/routes/+page.server.ts` — swap `createHit` → `db.createEvent`; share URL becomes `${url.origin}/respond/${code}`
- `src/routes/[code]/+page.server.ts` — swap `checkHitStatus` → `db.getEvent`; name/dates come directly from DB
- `src/lib/server/scheduler.ts` — remove `extractDatesFromDescription` and `parseEventName` (no longer needed)

**Deleted:**
- `src/lib/server/robo.ts`

**Env vars — remove:**
- `ROBO_BEARER_TOKEN`
- `ROBO_MCP_URL`
- `SENDER_NAME`

**Env vars — add:**
- `SUPABASE_URL` — from Supabase project → Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — use service role (not anon); all calls are server-side only

## Response data format

The respond form submits one checkbox per date named by its ISO string. The server action builds:

```ts
const responseData: Record<string, boolean> = {};
for (const date of event.dates) {
  responseData[date] = formData.get(date) === 'on';
}
```

This produces `{ "2026-02-20": true, "2026-02-21": false }` — already handled by Format 2 in `scheduler.ts:isAvailableForDate`. No changes needed to the heatmap, best time, or response list components.

## Package

```bash
npm install @supabase/supabase-js
```

## Setup steps (one-time)

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL editor
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env` and Vercel environment variables

## Cost impact

| | Free tier | Notes |
|---|---|---|
| Supabase | 500 MB DB, 50k MAU | More than enough at early scale |
| Vercel | Hobby: $0 | No change |
| Claude Haiku | ~$0.001/parse | ~$1–2/month at hundreds of events |

Robo cost removed entirely.
