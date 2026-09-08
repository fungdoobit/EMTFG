-- Run this once against an existing database that already ran schema.sql +
-- seed.sql (i.e. your live Supabase project). Safe to run more than once —
-- every statement is idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING).
--
-- Do NOT re-run schema.sql or seed.sql on a database that's already been
-- seeded — schema.sql is safe (it's all IF NOT EXISTS), but seed.sql always
-- inserts and would duplicate every process, hack, and glossary term.

alter table departments add column if not exists notes text;

update departments
set notes = 'Much of this content is adapted from the Finance Playbook originally compiled by Jia Qian and Vincent — credit to them for the groundwork this section is built on.'
where slug = 'finance';

insert into departments (slug, name) values
  ('business-development', 'Business Development'),
  ('customs-brokerage', 'Customs Brokerage'),
  ('trucking-and-haulage-transportation', 'Trucking and Haulage (Transportation)'),
  ('warehousing', 'Warehousing')
on conflict (slug) do nothing;
