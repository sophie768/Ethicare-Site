-- ============================================================================
-- Ethicare Resourcing — every table the website writes to (7 Oct 2026)
-- Run once in Supabase → SQL Editor → New query → Run. Safe to run again:
-- every statement is "if not exists". Region: West EU (Ireland).
--
-- Row level security is ON with no policies, on purpose: only the site's server
-- functions (which hold the service-role key in Netlify, never in a browser) can
-- read or write. Supabase will say "RLS enabled, no policies" — that is correct.
-- ============================================================================

-- 1. candidates — a full registration from /apply (netlify/functions/capture.js, kind "application")
create table if not exists candidates (
  id                 bigint generated always as identity primary key,
  public_ref         text unique default ('ETH-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6))),
  created_at         timestamptz not null default now(),
  full_name          text,
  email              text not null unique,
  phone              text,
  country_residence  text,
  nationality        text,
  profession         text,
  specialty          text,
  years_experience   text,
  destination        text,
  preferred_areas    text[],
  registration_stage text,
  relocate_timeline  text,
  relocating_with    text,
  dependents         integer,
  source             text,
  heard_about        text,
  referral_source    text,
  cv_filename        text,
  last_contact_at    timestamptz,
  raw                jsonb
);
alter table candidates enable row level security;

-- 2. consent_events — what each applicant agreed to, with the exact wording shown
create table if not exists consent_events (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  candidate_id  bigint references candidates(id) on delete cascade,
  email         text,
  kind          text,        -- privacy | employer_visibility
  granted       boolean not null,
  version       text,
  label_shown   text,
  source        text
);
alter table consent_events enable row level security;
create index if not exists consent_events_candidate_idx on consent_events (candidate_id);

-- 3. leads — every other form on the site: contact, landing page, Create my pack,
--    pathway checker, cost calculator, register interest, employer enquiries, ...
create table if not exists leads (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  source           text,       -- which form
  who              text,       -- candidate | employer
  name             text,
  email            text,
  phone            text,
  profession       text,
  destination      text,
  timeline         text,
  based_in         text,
  wants_call       text,
  role_alerts      boolean not null default false,
  quarterly_update boolean not null default false,
  referral_source  text,       -- which post or site sent them (utm_source / ?ref=)
  page             text,
  payload          jsonb       -- everything else they sent, incl. consent wording
);
alter table leads enable row level security;
create index if not exists leads_email_idx on leads (lower(email));
create index if not exists leads_created_idx on leads (created_at desc);

-- 4. my_move — the private My Plan spaces for placed candidates (netlify/functions/my-move.js)
create table if not exists my_move (
  key         text primary key,
  slug        text,
  data        jsonb not null default '{}'::jsonb,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table my_move enable row level security;
