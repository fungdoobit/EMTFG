-- Finance Department Process Hub — database schema
--
-- Run this once in the Supabase SQL Editor (or via `supabase db push`) on a
-- fresh project, before running seed.sql. Safe to re-run: every statement is
-- guarded with IF NOT EXISTS / OR REPLACE.
--
-- ── Why this shape ──────────────────────────────────────────────────────────
-- The content is a strict drill-down: Department -> Sub-department -> Process
-- -> Steps, with two things that cut across the tree (Hacks, Glossary).
--
-- * `department_id` is duplicated onto `processes` (as well as living on
--   `sub_departments`). It's redundant, but it means a process page can be
--   built from a single row without a second join, and the department slug
--   is available for breadcrumbs/URLs directly.
-- * A process is identified by (sub_department_id, slug), not slug alone.
--   The source content has two different "Payment Voucher" processes (one
--   under T12W, one under PHE) — keying by title alone would collide.
-- * Steps are their own table (not a JSON/array column) so each step keeps
--   an order and can be edited independently from the "Add/Edit process"
--   form without rewriting a blob.
-- * Hacks reference `process_id` as a nullable foreign key. One row answers
--   both "show hacks under a process" and "show all hacks" — no duplication
--   between the two views the spec asks for.

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ── Departments ──────────────────────────────────────────────────────────
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  -- optional freeform note shown on the department page — e.g. crediting
  -- whoever originally compiled the source material for that department
  notes text,
  created_at timestamptz not null default now()
);

-- Safety net for databases that already ran an earlier version of this
-- file before `notes` existed — harmless no-op on a fresh database.
alter table departments add column if not exists notes text;

-- ── Sub-departments ──────────────────────────────────────────────────────
create table if not exists sub_departments (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  slug text not null,
  name text not null,
  -- e.g. {"Excel", "Sovy", "Pelkon III"} — shown as a chip list on the sub-dept page
  tools_systems text[] not null default '{}',
  -- freeform cross-process observation, e.g. "most T12W processes rely on
  -- systems with little integration between them..."
  general_note text,
  created_at timestamptz not null default now(),
  unique (department_id, slug)
);

create index if not exists sub_departments_department_id_idx
  on sub_departments(department_id);

-- ── Communication matrix (who to ask about what, per sub-department) ────
create table if not exists sub_department_contacts (
  id uuid primary key default gen_random_uuid(),
  sub_department_id uuid not null references sub_departments(id) on delete cascade,
  name text not null,
  handles text not null,
  sort_order int not null default 0
);

create index if not exists sub_department_contacts_sub_department_id_idx
  on sub_department_contacts(sub_department_id);

-- ── Processes ────────────────────────────────────────────────────────────
create table if not exists processes (
  id uuid primary key default gen_random_uuid(),
  sub_department_id uuid not null references sub_departments(id) on delete cascade,
  department_id uuid not null references departments(id) on delete cascade,
  slug text not null,
  title text not null,
  -- optional notes/tips section, separate from hacks
  notes text,
  -- who (by name/role) needs to sign off on this — purely documentation,
  -- not a tracked workflow state, since sign-off here mostly happens on
  -- paper. Answers "who do I walk this to" without hunting through steps.
  approver text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz not null default now(),
  unique (sub_department_id, slug)
);

create index if not exists processes_sub_department_id_idx on processes(sub_department_id);
create index if not exists processes_department_id_idx on processes(department_id);

-- Safety net for databases that already ran an earlier version of this file.
alter table processes add column if not exists approver text;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists processes_set_updated_at on processes;
create trigger processes_set_updated_at
  before update on processes
  for each row
  execute function set_updated_at();

-- ── Process steps (ordered) ──────────────────────────────────────────────
create table if not exists process_steps (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references processes(id) on delete cascade,
  step_order int not null,
  title text not null,
  description text,
  unique (process_id, step_order)
);

create index if not exists process_steps_process_id_idx on process_steps(process_id);

-- ── Optional attachments (screenshots, files) ────────────────────────────
-- file_url points at a file in the "process-attachments" Supabase Storage
-- bucket (see README) — this table just tracks what belongs to which process.
create table if not exists process_attachments (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references processes(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists process_attachments_process_id_idx on process_attachments(process_id);

-- ── Hacks & improvement ideas ────────────────────────────────────────────
-- process_id is nullable on purpose: a hack can stand alone (e.g. a proposal
-- for a workflow that doesn't exist yet, like the GYM checkout ideas).
create table if not exists hacks (
  id uuid primary key default gen_random_uuid(),
  process_id uuid references processes(id) on delete set null,
  title text not null,
  description text not null,
  -- tracks whether the idea has actually gone anywhere, so the Hacks page
  -- and the department page's "Improvement Ideas" widget read as a tracker
  -- rather than a permanent wishlist
  status text not null default 'proposed',
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists hacks_process_id_idx on hacks(process_id);

-- Safety net for databases that already ran an earlier version of this file.
alter table hacks add column if not exists status text not null default 'proposed';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'hacks_status_check') then
    alter table hacks add constraint hacks_status_check
      check (status in ('proposed', 'in_progress', 'done'));
  end if;
end $$;

-- ── Glossary (cross-department, not tied to a sub-department) ───────────
create table if not exists glossary_terms (
  id uuid primary key default gen_random_uuid(),
  abbreviation text not null unique,
  full_term text not null,
  meaning text not null,
  sort_order int not null default 0
);

-- ── Feedback ─────────────────────────────────────────────────────────────
-- Open to anyone, no passcode — unlike every other write in this app. RLS
-- is enabled with zero policies, so the anon key can't read or write this
-- table directly either; submission only ever happens through the
-- submitFeedback Server Action (service role key). Read it from the
-- Supabase dashboard's Table Editor, which uses your own project access
-- and isn't subject to these policies.
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  page_path text,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

-- ── Row Level Security ───────────────────────────────────────────────────
-- Everyone (the "anon" key, used by the browser) can read. Nobody can write
-- through the anon key — all inserts/updates/deletes go through Server
-- Actions using the service role key, after the app checks the shared
-- passcode. That keeps the write path off the public API entirely instead
-- of trying to encode "knows the passcode" as an RLS policy.
alter table departments enable row level security;
alter table sub_departments enable row level security;
alter table sub_department_contacts enable row level security;
alter table processes enable row level security;
alter table process_steps enable row level security;
alter table process_attachments enable row level security;
alter table hacks enable row level security;
alter table glossary_terms enable row level security;

drop policy if exists "public read" on departments;
create policy "public read" on departments for select using (true);

drop policy if exists "public read" on sub_departments;
create policy "public read" on sub_departments for select using (true);

drop policy if exists "public read" on sub_department_contacts;
create policy "public read" on sub_department_contacts for select using (true);

drop policy if exists "public read" on processes;
create policy "public read" on processes for select using (true);

drop policy if exists "public read" on process_steps;
create policy "public read" on process_steps for select using (true);

drop policy if exists "public read" on process_attachments;
create policy "public read" on process_attachments for select using (true);

drop policy if exists "public read" on hacks;
create policy "public read" on hacks for select using (true);

drop policy if exists "public read" on glossary_terms;
create policy "public read" on glossary_terms for select using (true);

-- ── Storage bucket for process attachments (screenshots, files) ─────────
-- Public bucket: anyone with a file's URL can view it (matches "viewing the
-- site is open to anyone with the link"). Uploads only ever happen through
-- a Server Action using the service role key, so no anon write policy is
-- needed here either.
insert into storage.buckets (id, name, public)
values ('process-attachments', 'process-attachments', true)
on conflict (id) do nothing;
