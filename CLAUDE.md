# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for Vercel deployment
npm run check        # Type-check with svelte-check
npm run check:watch  # Watch mode type checking
npm run preview      # Preview production build locally
```

There is no test framework configured.

## Environment Variables

Create a `.env` file with:
```
BLOB_READ_WRITE_TOKEN= # Vercel Blob read/write token
ANTHROPIC_API_KEY=     # Claude API key
```

## Architecture

**rischedule** is a group scheduling app: users describe an event in natural language, Claude parses it into structured data, and participants fill in availability via a self-hosted respond form. The app then shows a heatmap of when everyone is free.

### Request Flow

1. **Parse** — User types natural language (e.g. "Carwash with Matt, next Thu or Fri") → `?/parse` server action → `src/lib/server/ai.ts:parseNaturalLanguage()` calls Claude Haiku → returns `ParsedEvent`
2. **Preview** — `ParsedPreview.svelte` shows the parsed result; user can confirm or edit
3. **Create** — `?/create` server action → `src/lib/server/blob.ts:createEvent()` stores event JSON in Vercel Blob → returns event code
4. **Respond** — Participants open `/respond/[code]`, fill in date checkboxes, `addResponse()` appends to blob
5. **Results** — `/[code]` page polls every 10 seconds → `src/lib/server/scheduler.ts:findBestTimes()` aggregates responses → renders `HeatmapGrid` and `BestTime`

### Key Server Modules

| File | Responsibility |
|------|---------------|
| `src/lib/server/ai.ts` | Claude Haiku integration — parses NL input into `ParsedEvent` (name, participants, proposed dates, time preference) |
| `src/lib/server/blob.ts` | Vercel Blob CRUD — `createEvent()`, `getEvent()`, `getResponses()`, `addResponse()`, `deleteEvent()`, `isExpired()` |
| `src/lib/server/scheduler.ts` | Availability analysis — `findBestTimes()` scores dates by participant count |
| `src/lib/types.ts` | Shared TypeScript interfaces (`ParsedEvent`, `StoredEvent`, `StoredResponse`, `TimeSlot`, etc.) |

### Routes

| Route | Purpose |
|-------|---------|
| `/` | Home: NL input, manual form, event lookup by code; recent events in localStorage |
| `/[code]` | Event detail: dual-mode (responding vs. organizing via `?organizer=1`), live results polling |
| `/respond/[code]` | Self-hosted availability form: participant name + date checkboxes |

### Svelte 5

The project uses **Svelte 5** with runes (`$state`, `$derived`, `$props`, `$bindable`). Do not use legacy Svelte 4 syntax (`export let`, `$:`, stores).

### Date Handling

The NL parser (via Claude) generates candidate dates; post-processing in `ai.ts` filters them by `maxWeeksAhead` (1–8) and `maxDateOptions` (3–30), which users can tune in the advanced options panel on the home page.

### Blob Storage Layout

Events are stored as `events/{code}.json` (a `StoredEvent`) and responses as `responses/{code}.json` (a `StoredResponse[]`). Both are public blobs. Expired events (all dates in the past) are deleted lazily on load.

## Deployment

Deployed to Vercel via `@sveltejs/adapter-vercel`. The `.vercel/` directory holds project config and should not be deleted.
