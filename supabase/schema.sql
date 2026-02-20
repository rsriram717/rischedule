-- Run this in your Supabase SQL editor

CREATE TABLE events (
  code       TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  dates      TEXT[] NOT NULL,
  time_pref  TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE responses (
  id               SERIAL PRIMARY KEY,
  event_code       TEXT NOT NULL REFERENCES events(code),
  participant_name TEXT NOT NULL,
  response_data    JSONB NOT NULL,  -- { "2026-02-20": true, "2026-02-21": false }
  responded_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_code, participant_name)
);
