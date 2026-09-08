-- Run this once against your existing Supabase project. Safe to run more
-- than once.
--
-- Adds a feedback table for the site's new feedback form (open to anyone,
-- no passcode). RLS is enabled with no policies at all, so the anon key
-- can't read or write it directly — submissions only happen through the
-- submitFeedback Server Action (service role key). You'll read submissions
-- from the Supabase dashboard's Table Editor, which isn't subject to these
-- policies.

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  page_path text,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;
