-- ============================================================================
-- My Move — private candidate portal · schema, row-level security, triggers
-- ----------------------------------------------------------------------------
-- Run once per Supabase project (staging first, then production), in the SQL
-- editor or with `supabase db push`. Every table has RLS ON and denies by
-- default: a row is readable or writable only where a policy below says so.
--
-- Load-bearing rules (from SCHEMA.md in the design handoff):
--   · Authorisation derives from the authenticated identity (auth.uid()) and
--     the staff_profiles / candidate_cases tables — never from an id the
--     browser supplies.
--   · Draft (staff working copy, case_draft) and published (candidate-readable
--     snapshot, candidate_cases.published) are separate. Candidates read the
--     my_case VIEW only; they have no policy on any base table that holds a
--     draft.
--   · Staff access requires a second factor: every staff policy checks the
--     JWT's aal claim is 'aal2'. Hiding a button is not access control.
--   · consent_events and access_audit are append-only.
-- ============================================================================

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Helper functions (SECURITY DEFINER — owned by postgres, bypass RLS so a
--    policy can consult another table without recursing into its policies)
-- ---------------------------------------------------------------------------
create or replace function public.mm_jwt() returns jsonb
language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;

create or replace function public.mm_is_service() returns boolean
language sql stable as $$
  select (public.mm_jwt()->>'role') = 'service_role'
$$;

-- The caller's staff role, or null. Looked up, never trusted from the client.
create or replace function public.mm_staff_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.staff_profiles where id = auth.uid() and active
$$;

-- Staff = has an active staff profile AND signed in with two factors.
create or replace function public.mm_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mm_staff_role() is not null and (public.mm_jwt()->>'aal') = 'aal2'
$$;

create or replace function public.mm_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mm_staff_role() = 'admin' and (public.mm_jwt()->>'aal') = 'aal2'
$$;

-- Admin: every case. Support: only cases assigned to them.
create or replace function public.mm_can_manage(p_case uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.mm_is_staff() and (
    public.mm_staff_role() = 'admin'
    or exists (select 1 from public.candidate_cases c where c.id = p_case and c.assigned_staff_id = auth.uid())
  )
$$;

-- The signed-in candidate owns this case and it is live for them.
create or replace function public.mm_owns_case(p_case uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.candidate_cases c
    where c.id = p_case and c.auth_user_id = auth.uid()
      and c.status = 'active' and c.invitation in ('sent', 'accepted')
  )
$$;

-- Public reference: identifies a case in conversation, never authorises.
create or replace function public.mm_new_ref() returns text
language plpgsql volatile as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  bytes bytea := gen_random_bytes(6);
  ref text := 'EC-';
  i int;
begin
  for i in 0..5 loop
    ref := ref || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return ref;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------
create table if not exists public.staff_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       citext not null unique,
  role        text not null check (role in ('admin', 'support')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.candidate_cases (
  id                uuid primary key default gen_random_uuid(),
  public_ref        text unique not null default public.mm_new_ref(),
  auth_user_id      uuid references auth.users(id) on delete set null,
  assigned_staff_id uuid not null references public.staff_profiles(id),
  first_name        text not null default '',
  last_name         text not null default '',
  email             citext,
  status            text not null default 'draft'
                      check (status in ('draft', 'active', 'suspended', 'archived')),
  invitation        text not null default 'draft'
                      check (invitation in ('draft', 'sent', 'accepted', 'revoked', 'expired')),
  vincere_id        text,                       -- reserved: future one-way Vincere sync
  published         jsonb,                      -- candidate-facing snapshot; null until published
  published_at      timestamptz,
  invited_at        timestamptz,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  last_update       timestamptz not null default now()
);
create index if not exists candidate_cases_auth_user_idx on public.candidate_cases (auth_user_id);
create index if not exists candidate_cases_assigned_idx on public.candidate_cases (assigned_staff_id);
create index if not exists candidate_cases_status_idx on public.candidate_cases (status, invitation);

-- Staff working copy. NO candidate policy exists on this table, ever.
create table if not exists public.case_draft (
  case_id     uuid primary key references public.candidate_cases(id) on delete cascade,
  draft       jsonb not null default '{}'::jsonb,   -- { role, welcome, nextActions[], tasks[], guides[] }
  updated_at  timestamptz not null default now()
);

-- Candidate-owned arrangements (flights, accommodation, car). Independent of publish.
create table if not exists public.case_arrangements (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.candidate_cases(id) on delete cascade,
  type         text not null default 'other',
  label        text not null default '',
  detail       text not null default '',
  state        text not null default 'planned' check (state in ('planned', 'booked', 'awaiting')),
  editable_by  text not null default 'candidate' check (editable_by in ('candidate', 'staff')),
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists case_arrangements_case_idx on public.case_arrangements (case_id);

-- Candidate progress on published, non-staff-controlled tasks.
create table if not exists public.case_task_progress (
  case_id        uuid not null references public.candidate_cases(id) on delete cascade,
  task_key       text not null,
  status         text not null check (status in ('not_started', 'in_progress', 'waiting', 'complete', 'na')),
  self_reported  boolean not null default true,
  updated_at     timestamptz not null default now(),
  primary key (case_id, task_key)
);

-- Shared notes: visible to the candidate and the staff supporting the move.
create table if not exists public.shared_notes (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.candidate_cases(id) on delete cascade,
  author_uid   uuid not null,
  author_kind  text not null check (author_kind in ('staff', 'candidate')),
  author_name  text not null,
  body         text not null check (length(body) between 1 and 4000),
  created_at   timestamptz not null default now()
);
create index if not exists shared_notes_case_idx on public.shared_notes (case_id, created_at);

-- Reusable starting sets. Applying copies; editing a master never touches a case.
create table if not exists public.templates (
  id           text primary key,
  label        text not null,
  destination  text,
  tasks        jsonb not null default '[]'::jsonb,
  guides       jsonb not null default '[]'::jsonb,
  sort_order   int not null default 0,
  updated_at   timestamptz not null default now()
);

-- Append-only.
create table if not exists public.consent_events (
  id           bigserial primary key,
  case_id      uuid references public.candidate_cases(id) on delete set null,
  kind         text not null,
  version      text not null,
  label_shown  text not null,
  granted      boolean not null,
  source       text not null,
  created_at   timestamptz not null default now()
);
create table if not exists public.access_audit (
  id           bigserial primary key,
  actor_uid    uuid,
  actor_role   text,
  case_id      uuid,
  action       text not null,
  detail       jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists access_audit_case_idx on public.access_audit (case_id, created_at);

-- ---------------------------------------------------------------------------
-- 3. Candidate-facing view — the ONLY thing a candidate selects for their case.
--    Owner-privileged (default), filtered by auth.uid(); exposes safe columns.
-- ---------------------------------------------------------------------------
create or replace view public.my_case as
  select c.id, c.public_ref, c.status, c.invitation, c.first_name, c.last_name,
         c.published, c.published_at, c.last_update,
         s.name as contact_name, s.email as contact_email
  from public.candidate_cases c
  join public.staff_profiles s on s.id = c.assigned_staff_id
  where c.auth_user_id = auth.uid()
    and c.status = 'active'
    and c.invitation in ('sent', 'accepted');

revoke all on public.my_case from anon, public;
grant select on public.my_case to authenticated;

-- First authenticated read flips the invitation from sent → accepted.
create or replace function public.mm_accept_invitation() returns void
language sql volatile security definer set search_path = public as $$
  update public.candidate_cases
     set invitation = 'accepted', last_update = now()
   where auth_user_id = auth.uid() and status = 'active' and invitation = 'sent'
$$;
revoke all on function public.mm_accept_invitation() from public, anon;
grant execute on function public.mm_accept_invitation() to authenticated;

-- Who am I? Lets the app route a signed-in person before their second factor
-- is verified (staff policies need aal2, so a plain select would return nothing).
-- Returns only what the person is entitled to know about themselves.
create or replace function public.mm_whoami() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select jsonb_build_object('kind', 'staff', 'role', role, 'name', name, 'email', email, 'active', active)
       from public.staff_profiles where id = auth.uid()),
    (select jsonb_build_object('kind', 'candidate', 'case_id', id, 'status', status, 'invitation', invitation, 'first_name', first_name)
       from public.candidate_cases where auth_user_id = auth.uid()
       order by (status = 'active' and invitation in ('sent', 'accepted')) desc, last_update desc limit 1),
    '{"kind":"none"}'::jsonb)
$$;
revoke all on function public.mm_whoami() from public, anon;
grant execute on function public.mm_whoami() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Triggers
-- ---------------------------------------------------------------------------
create or replace function public.mm_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Lifecycle columns change only through the server functions (service role).
create or replace function public.mm_guard_case_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.mm_is_service() then
    if new.id is distinct from old.id
       or new.public_ref is distinct from old.public_ref
       or new.auth_user_id is distinct from old.auth_user_id
       or new.status is distinct from old.status
       or new.invitation is distinct from old.invitation
       or new.published is distinct from old.published
       or new.published_at is distinct from old.published_at
       or new.invited_at is distinct from old.invited_at
       or new.created_at is distinct from old.created_at
       or new.created_by is distinct from old.created_by then
      raise exception 'This field is set by the server, not the browser' using errcode = '42501';
    end if;
    -- support staff may not hand a case to someone else
    if new.assigned_staff_id is distinct from old.assigned_staff_id and not public.mm_is_admin() then
      raise exception 'Only an admin can reassign a case' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  new.last_update := now();
  return new;
end $$;
drop trigger if exists candidate_cases_guard on public.candidate_cases;
create trigger candidate_cases_guard before update on public.candidate_cases
  for each row execute function public.mm_guard_case_update();

create or replace function public.mm_case_insert_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.mm_is_service() then
    new.auth_user_id := null; new.status := 'draft'; new.invitation := 'draft';
    new.published := null; new.published_at := null; new.invited_at := null;
    new.created_by := auth.uid();
  end if;
  return new;
end $$;
drop trigger if exists candidate_cases_insert on public.candidate_cases;
create trigger candidate_cases_insert before insert on public.candidate_cases
  for each row execute function public.mm_case_insert_defaults();

-- A draft edit stamps the case's last_update so the list shows "Unpublished edits".
create or replace function public.mm_draft_touch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  update public.candidate_cases set last_update = now() where id = new.case_id;
  return new;
end $$;
drop trigger if exists case_draft_touch on public.case_draft;
create trigger case_draft_touch before insert or update on public.case_draft
  for each row execute function public.mm_draft_touch();

-- The database, not the UI, refuses a candidate ticking a staff-controlled milestone.
create or replace function public.mm_task_progress_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pub jsonb;
  t jsonb;
begin
  if not public.mm_is_service() and not public.mm_is_staff() then
    select published into pub from public.candidate_cases where id = new.case_id;
    if pub is null then
      raise exception 'Nothing is published for this case' using errcode = '42501';
    end if;
    select x into t from jsonb_array_elements(coalesce(pub->'tasks', '[]'::jsonb)) x
      where x->>'id' = new.task_key limit 1;
    if t is null then
      raise exception 'Unknown task' using errcode = '42501';
    end if;
    if coalesce((t->>'staffControlled')::boolean, false) then
      raise exception 'This milestone is confirmed by Ethicare and cannot be self-reported' using errcode = '42501';
    end if;
    new.self_reported := true;
  end if;
  new.updated_at := now();
  update public.candidate_cases set last_update = now() where id = new.case_id;
  return new;
end $$;
drop trigger if exists case_task_progress_guard on public.case_task_progress;
create trigger case_task_progress_guard before insert or update on public.case_task_progress
  for each row execute function public.mm_task_progress_guard();

create or replace function public.mm_arrangement_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.mm_is_service() and not public.mm_is_staff() then
    -- a candidate's own rows are always candidate-editable; they cannot mint staff rows
    new.editable_by := 'candidate';
    if tg_op = 'UPDATE' and new.case_id is distinct from old.case_id then
      raise exception 'Cannot move an arrangement between cases' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  update public.candidate_cases set last_update = now() where id = new.case_id;
  return new;
end $$;
drop trigger if exists case_arrangements_guard on public.case_arrangements;
create trigger case_arrangements_guard before insert or update on public.case_arrangements
  for each row execute function public.mm_arrangement_guard();

-- Note authorship is set from the identity, never from the posted row.
create or replace function public.mm_note_author() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  nm text;
begin
  if public.mm_is_service() then
    return new;
  end if;
  new.author_uid := auth.uid();
  new.created_at := now();
  if public.mm_can_manage(new.case_id) then
    select name into nm from public.staff_profiles where id = auth.uid();
    new.author_kind := 'staff';
    new.author_name := coalesce(nm, 'Ethicare');
  elsif public.mm_owns_case(new.case_id) then
    select trim(first_name || ' ' || last_name) into nm from public.candidate_cases where id = new.case_id;
    new.author_kind := 'candidate';
    new.author_name := coalesce(nullif(nm, ''), 'Candidate');
  else
    raise exception 'Not permitted' using errcode = '42501';
  end if;
  update public.candidate_cases set last_update = now() where id = new.case_id;
  return new;
end $$;
drop trigger if exists shared_notes_author on public.shared_notes;
create trigger shared_notes_author before insert on public.shared_notes
  for each row execute function public.mm_note_author();

drop trigger if exists templates_touch on public.templates;
create trigger templates_touch before update on public.templates
  for each row execute function public.mm_touch();

-- ---------------------------------------------------------------------------
-- 5. Row-level security — ON everywhere, deny by default
-- ---------------------------------------------------------------------------
alter table public.staff_profiles      enable row level security;
alter table public.candidate_cases     enable row level security;
alter table public.case_draft          enable row level security;
alter table public.case_arrangements   enable row level security;
alter table public.case_task_progress  enable row level security;
alter table public.shared_notes        enable row level security;
alter table public.templates           enable row level security;
alter table public.consent_events      enable row level security;
alter table public.access_audit        enable row level security;

-- staff_profiles: staff see the team (names for "assigned to"); admins manage it.
drop policy if exists staff_read on public.staff_profiles;
create policy staff_read on public.staff_profiles for select
  using (public.mm_is_staff());
drop policy if exists staff_admin_write on public.staff_profiles;
create policy staff_admin_write on public.staff_profiles for update
  using (public.mm_is_admin()) with check (public.mm_is_admin());

-- candidate_cases: staff only. Candidates read the my_case view, never this table.
drop policy if exists cases_staff_read on public.candidate_cases;
create policy cases_staff_read on public.candidate_cases for select
  using (public.mm_can_manage(id));
drop policy if exists cases_admin_insert on public.candidate_cases;
create policy cases_admin_insert on public.candidate_cases for insert
  with check (public.mm_is_admin());
drop policy if exists cases_staff_update on public.candidate_cases;
create policy cases_staff_update on public.candidate_cases for update
  using (public.mm_can_manage(id)) with check (public.mm_can_manage(id));
-- no delete policy: permanent erasure is delete-case (service role, admin-verified)

-- case_draft: staff only. There is deliberately NO candidate policy.
drop policy if exists draft_staff_all on public.case_draft;
create policy draft_staff_all on public.case_draft for all
  using (public.mm_can_manage(case_id)) with check (public.mm_can_manage(case_id));

-- case_arrangements: staff on managed cases; candidates on their own case.
drop policy if exists arr_staff_all on public.case_arrangements;
create policy arr_staff_all on public.case_arrangements for all
  using (public.mm_can_manage(case_id)) with check (public.mm_can_manage(case_id));
drop policy if exists arr_candidate_read on public.case_arrangements;
create policy arr_candidate_read on public.case_arrangements for select
  using (public.mm_owns_case(case_id));
drop policy if exists arr_candidate_insert on public.case_arrangements;
create policy arr_candidate_insert on public.case_arrangements for insert
  with check (public.mm_owns_case(case_id));
drop policy if exists arr_candidate_update on public.case_arrangements;
create policy arr_candidate_update on public.case_arrangements for update
  using (public.mm_owns_case(case_id) and editable_by = 'candidate')
  with check (public.mm_owns_case(case_id) and editable_by = 'candidate');
drop policy if exists arr_candidate_delete on public.case_arrangements;
create policy arr_candidate_delete on public.case_arrangements for delete
  using (public.mm_owns_case(case_id) and editable_by = 'candidate');

-- case_task_progress: staff on managed cases; candidates on their own case
-- (the trigger above additionally rejects staff-controlled task keys).
drop policy if exists prog_staff_all on public.case_task_progress;
create policy prog_staff_all on public.case_task_progress for all
  using (public.mm_can_manage(case_id)) with check (public.mm_can_manage(case_id));
drop policy if exists prog_candidate_all on public.case_task_progress;
create policy prog_candidate_all on public.case_task_progress for all
  using (public.mm_owns_case(case_id)) with check (public.mm_owns_case(case_id));

-- shared_notes: read + append for the candidate and the staff on the case. No edit, no delete.
drop policy if exists notes_read on public.shared_notes;
create policy notes_read on public.shared_notes for select
  using (public.mm_owns_case(case_id) or public.mm_can_manage(case_id));
drop policy if exists notes_insert on public.shared_notes;
create policy notes_insert on public.shared_notes for insert
  with check (public.mm_owns_case(case_id) or public.mm_can_manage(case_id));

-- templates: staff read; admin edit.
drop policy if exists templates_staff_read on public.templates;
create policy templates_staff_read on public.templates for select
  using (public.mm_is_staff());
drop policy if exists templates_admin_write on public.templates;
create policy templates_admin_write on public.templates for all
  using (public.mm_is_admin()) with check (public.mm_is_admin());

-- consent_events / access_audit: admin read only; writes come from the service role.
drop policy if exists consent_admin_read on public.consent_events;
create policy consent_admin_read on public.consent_events for select
  using (public.mm_is_admin());
drop policy if exists audit_admin_read on public.access_audit;
create policy audit_admin_read on public.access_audit for select
  using (public.mm_is_admin());

-- The anon key must reach nothing here (RLS already denies; belt and braces).
revoke all on public.staff_profiles, public.candidate_cases, public.case_draft,
  public.case_arrangements, public.case_task_progress, public.shared_notes,
  public.templates, public.consent_events, public.access_audit from anon;

-- ---------------------------------------------------------------------------
-- 6. Server-only functions (called by the Netlify function with the service
--    role via RPC; not executable by anon or authenticated users)
-- ---------------------------------------------------------------------------
create or replace function public.mm_auth_user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1
$$;
revoke all on function public.mm_auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.mm_auth_user_id_by_email(text) to service_role;

-- Ends every live session for a user so revocation reaches existing devices,
-- not only new requests. Pair with a short JWT expiry in Auth settings.
create or replace function public.mm_revoke_sessions(p_uid uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  delete from auth.refresh_tokens where user_id = p_uid::text;
  delete from auth.sessions where user_id = p_uid;
end $$;
revoke all on function public.mm_revoke_sessions(uuid) from public, anon, authenticated;
grant execute on function public.mm_revoke_sessions(uuid) to service_role;

-- Permanent erasure of personal fields (delete-case). The case row survives
-- de-identified so consent_events and access_audit keep their history.
create or replace function public.mm_erase_case(p_case uuid) returns void
language plpgsql volatile security definer set search_path = public as $$
begin
  delete from public.case_draft where case_id = p_case;
  delete from public.case_arrangements where case_id = p_case;
  delete from public.case_task_progress where case_id = p_case;
  delete from public.shared_notes where case_id = p_case;
  update public.candidate_cases
     set first_name = '', last_name = '', email = null, auth_user_id = null,
         published = null, published_at = null, vincere_id = null,
         status = 'archived', invitation = 'revoked', last_update = now()
   where id = p_case;
end $$;
revoke all on function public.mm_erase_case(uuid) from public, anon, authenticated;
grant execute on function public.mm_erase_case(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 7. Optional: custom access-token hook. Stamps user_role (admin | support |
--    candidate) and, for candidates, case_id into the JWT so the client can
--    route without a query. Policies above still look the role up — the claim
--    is a convenience, never the authority. Enable in Auth → Hooks.
-- ---------------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  claims jsonb := coalesce(event->'claims', '{}'::jsonb);
  uid uuid := (event->>'user_id')::uuid;
  r text;
  cid uuid;
begin
  select role into r from public.staff_profiles where id = uid and active;
  if r is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(r));
  else
    select id into cid from public.candidate_cases where auth_user_id = uid and status = 'active' limit 1;
    if cid is not null then
      claims := jsonb_set(claims, '{user_role}', '"candidate"'::jsonb);
      claims := jsonb_set(claims, '{case_id}', to_jsonb(cid::text));
    end if;
  end if;
  return jsonb_set(event, '{claims}', claims);
end $$;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- ---------------------------------------------------------------------------
-- 8. Starting templates. Task ids are STABLE keys (template/slug) so applying
--    the same template again keeps a candidate's progress rows attached.
-- ---------------------------------------------------------------------------
insert into public.templates (id, label, destination, sort_order, guides, tasks) values
('au-imaging', 'Australia · medical imaging & radiation', 'Australia', 1,
 '["reg-au","visa-au","money-au","rent-au","drive-au"]'::jsonb,
 '[
  {"id":"au-imaging/ahpra","phase":"registration","title":"Ahpra registration application","why":"The Medical Radiation Practice Board assesses your qualification and recent practice.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"au-imaging/wa-licence","phase":"registration","title":"WA radiation use licence","why":"A state licence to use radiation, separate from your national Ahpra registration.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"au-imaging/visa","phase":"registration","title":"Skilled visa — subclass confirmation","why":"Runs largely in parallel with registration; we sequence it with you.","owner":"ethicare","status":"not_started","selfReported":false,"staffControlled":true,"due":null,"waitingOn":null},
  {"id":"au-imaging/checks","phase":"registration","title":"Police & health checks","why":"Needed for the visa and slow to arrive, so start early.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"au-imaging/flights","phase":"travel","title":"Book one-way flights","why":"Your baggage allowance shapes the shipping decision.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"au-imaging/temp-accom","phase":"travel","title":"Temporary accommodation for the first fortnight","why":"Almost nobody signs a lease before landing.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"au-imaging/bank","phase":"settle","title":"Open an Australian bank account","why":"Some banks let you start before you fly.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"au-imaging/tfn","phase":"settle","title":"Apply for a Tax File Number","why":"Without it you are taxed at the top rate from day one.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null}
 ]'::jsonb),
('nz-nursing', 'New Zealand · nursing & midwifery', 'New Zealand', 2,
 '["reg-nz","visa-nz","money-nz","rent-nz","first-nz"]'::jsonb,
 '[
  {"id":"nz-nursing/council","phase":"registration","title":"Nursing Council registration","why":"The Council assesses your qualification, English and recent practice.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"nz-nursing/cap","phase":"registration","title":"Competence Assessment Programme (CAP)","why":"A short bridging programme some applicants complete after arrival.","owner":"regulator","status":"not_started","selfReported":false,"staffControlled":true,"due":null,"waitingOn":null},
  {"id":"nz-nursing/visa","phase":"registration","title":"Work visa decision","why":"Confirmed in parallel with registration.","owner":"ethicare","status":"not_started","selfReported":false,"staffControlled":true,"due":null,"waitingOn":null},
  {"id":"nz-nursing/flights","phase":"travel","title":"Flights booked","why":"Confirm dates once your start date is fixed.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"nz-nursing/shipping","phase":"travel","title":"Shipping vs. selling","why":"Sea freight takes weeks; quotes vary widely.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"nz-nursing/ird","phase":"settle","title":"IRD number","why":"Needed for correct tax from your first pay.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"nz-nursing/gp","phase":"settle","title":"Enrol the family with a GP","why":"Enrolment is a task, not automatic.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null}
 ]'::jsonb),
('nz-imaging', 'New Zealand · medical imaging & radiation', 'New Zealand', 3,
 '["reg-nz","visa-nz","money-nz","rent-nz","first-nz"]'::jsonb,
 '[
  {"id":"nz-imaging/mrtb","phase":"registration","title":"Medical Radiation Technologists Board registration","why":"The Board assesses your qualification, English and recent practice.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"nz-imaging/apc","phase":"registration","title":"Annual practising certificate","why":"Issued once registration is granted; you need it before your first shift.","owner":"regulator","status":"not_started","selfReported":false,"staffControlled":true,"due":null,"waitingOn":null},
  {"id":"nz-imaging/visa","phase":"registration","title":"Work visa decision","why":"Confirmed in parallel with registration.","owner":"ethicare","status":"not_started","selfReported":false,"staffControlled":true,"due":null,"waitingOn":null},
  {"id":"nz-imaging/flights","phase":"travel","title":"Flights booked","why":"Confirm dates once your start date is fixed.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"nz-imaging/temp-accom","phase":"travel","title":"Temporary accommodation for the first fortnight","why":"Almost nobody signs a lease before landing.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"nz-imaging/ird","phase":"settle","title":"IRD number","why":"Needed for correct tax from your first pay.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null},
  {"id":"nz-imaging/bank","phase":"settle","title":"Open a New Zealand bank account","why":"Several banks let you open an account before you arrive.","owner":"you","status":"not_started","selfReported":false,"staffControlled":false,"due":null,"waitingOn":null}
 ]'::jsonb)
on conflict (id) do nothing;
