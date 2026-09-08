-- Run this once against a database that already ran schema.sql + seed.sql
-- (+ 002_expansion.sql + 003_hack_status.sql). Safe to run more than once.
--
-- Adds an "approver" field to processes — who needs to sign off on it,
-- e.g. "Dr. Khana". Purely documentation (there's no tracked approval
-- workflow here, since sign-off mostly happens on paper) — it just answers
-- "who do I walk this to" without hunting through the step list.
--
-- Backfills the processes where the guidebook explicitly names someone in
-- an approval/signature/verification step. Every other process is left
-- null — not every process has a named approver in the source material,
-- and null is the honest answer there rather than guessing one.

alter table processes add column if not exists approver text;

update processes set approver = 'Dr. Khana'
where slug = 'penang-port-daily-invoices' and approver is null;

update processes set approver = 'Ms. Ho (verification)'
where slug = 'non-trade-ar-billing' and approver is null;

update processes set approver = 'HQ (approval)'
where slug = 'credit-note-requisition' and approver is null;

update processes set approver = 'Ms. Ho (verification)'
where slug = 'job-entry-listing-closing' and approver is null;

update processes set approver = 'Dr. Khana'
where slug = 'payment-voucher' and approver is null;

update processes set approver = 'PIC (signs invoice)'
where slug = 'ap-invoices-entry' and approver is null;

update processes set approver = 'HR (for toll claims)'
where slug = 'petty-cash' and approver is null;

update processes set approver = 'Elaine (signature); DAL & DSMT (listing approval)'
where slug = 'payment-voucher-full-process' and approver is null;
