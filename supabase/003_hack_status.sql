-- Run this once against a database that already ran schema.sql + seed.sql +
-- 002_expansion.sql. Safe to run more than once.
--
-- Adds a status field to hacks (proposed / in_progress / done) so the Hacks
-- page and the department page's "Improvement Ideas" widget can act as a
-- tracker. Every existing hack defaults to 'proposed' — accurate, since
-- none of the guidebook's suggestions have been implemented yet.

alter table hacks add column if not exists status text not null default 'proposed';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'hacks_status_check') then
    alter table hacks add constraint hacks_status_check
      check (status in ('proposed', 'in_progress', 'done'));
  end if;
end $$;
