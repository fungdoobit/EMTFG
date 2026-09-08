# EMT Hub

A drill-down knowledge base for internal processes: **Department → Sub-department →
Process → Flow/Tutorial**, plus a cross-cutting "Hacks & Improvement Ideas" board
and a glossary. Seeded with the real Finance department content (T12W and PHE)
instead of placeholder data.

Built with Next.js (App Router) and Supabase (Postgres). Viewing is open to
anyone with the link; adding/editing/deleting is behind one shared passcode.

## How the pieces fit together

- **Next.js** renders everything server-side (Server Components) and reads are
  plain `async` functions in `src/lib/queries.ts` — no client-side data
  fetching library needed.
- **Supabase** is just Postgres plus an auto-generated REST API
  ([PostgREST](https://postgrest.org)) in front of it. `@supabase/supabase-js`
  talks to that API.
- **Two Supabase clients, two jobs.** `src/lib/supabase/client.ts` uses the
  *anon* key and can only read (see the Row Level Security policies in
  `supabase/schema.sql` — every table allows public `select`, nothing else).
  `src/lib/supabase/admin.ts` uses the *service role* key, which bypasses RLS
  entirely, and is only ever imported from Server Actions in
  `src/lib/actions.ts` — never from a Client Component. That split means the
  browser can never write to the database directly, no matter what a client
  sends; every mutation has to go through a Server Action, which checks the
  passcode itself.
- **The passcode isn't a login system.** `src/lib/auth.ts` sets a cookie
  containing an HMAC signed with `APP_PASSCODE` as the key, not the passcode
  itself. Every mutating Server Action calls `requireUnlocked()` at the top —
  hiding the "Add process" button from someone who hasn't entered the
  passcode is a UX nicety, not the actual security boundary; the check inside
  the action is.

## Database schema

See `supabase/schema.sql` for the full definitions and comments on *why* each
table is shaped the way it is. Short version:

| Table | Purpose |
|---|---|
| `departments` | Top level. Ships with Finance, Business Development, Customs Brokerage, Trucking and Haulage (Transportation), and Warehousing — the last four start empty. `notes` is an optional freeform blurb shown on the department page (used for the Finance credits note). |
| `sub_departments` | Belongs to a department. Carries its tools/systems list and a freeform note. Addable from the UI (department page → "+ Add sub-department") — needed since a brand-new department has nothing under it yet. |
| `sub_department_contacts` | The "Sifu Guide" — who to ask about what, per sub-department. Fully editable from the sub-department page (add/edit/delete), since contacts change over time. |
| `processes` | Belongs to a sub-department. Keyed by `(sub_department_id, slug)`, not slug alone — T12W and PHE both have a "Payment Voucher" process with different steps, and this is how they don't collide. `approver` is an optional freeform "requires sign-off from" note — pure documentation, not a tracked approval workflow (sign-off here mostly happens on paper). |
| `process_steps` | Ordered steps for a process. Rendered as a simple numbered flow on the process page. |
| `process_attachments` | Optional files/screenshots per process, stored in Supabase Storage. |
| `hacks` | Improvement ideas. `process_id` is a **nullable** foreign key — a hack can be linked to the process it improves, or stand alone. One table drives both "notes under a process" and the standalone Hacks page. |
| `glossary_terms` | Cross-department abbreviations, not tied to any sub-department. |

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and click **New project**.
2. Pick an organization, name the project (e.g. `finance-process-hub`), set a
   database password (save it somewhere — you likely won't need it again, but
   it's how you'd connect a raw Postgres client to the same database), and a
   region close to your team. Create the project and wait ~2 minutes for it
   to provision.

### 3. Run the schema and seed data

1. In the Supabase dashboard, open **SQL Editor** (left sidebar).
2. Paste the contents of `supabase/schema.sql`, run it. This creates every
   table, the storage bucket for attachments, and the "public can read"
   policies.
3. Open a new query, paste the contents of `supabase/seed.sql`, run it. This
   loads the real Finance content — 41 processes across T12W and PHE, every
   hack from the playbook, and the glossary.

Re-running `seed.sql` will duplicate everything (it always inserts). If you
need to start over, run the `truncate` statement at the top of that file
first.

If your database already ran `schema.sql` + `seed.sql` before this repo grew
past its first version, run any `supabase/00N_*.sql` delta files you haven't
applied yet, in order (`002_expansion.sql`, `003_hack_status.sql`,
`004_process_approver.sql`, ...). Each is idempotent and only adds what's
missing — safe to run even if you're not sure whether you've run it before.

### 4. Get your API keys

In the Supabase dashboard: **Project Settings → API**.

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Project API keys → anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Project API keys → service_role** → `SUPABASE_SERVICE_ROLE_KEY` (click
  "reveal" — treat this like a password, it bypasses every RLS policy)

### 5. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the three Supabase values above, plus `APP_PASSCODE` — anything you
like; it's the shared passcode your team will type in to add/edit/delete
content.

### 6. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the
Finance department with T12W and PHE underneath it, fully populated.

> **Note on testing in this environment:** this project was built in a
> sandboxed session without a real Supabase project or Docker available, so
> the app itself couldn't be exercised end-to-end in a browser here. What
> *was* validated: `supabase/schema.sql` and `supabase/seed.sql` run cleanly
> against a real local Postgres (41 processes, 176 steps, 12 correctly-linked
> hacks, 24 glossary terms — verified with SQL queries, no orphaned rows, no
> slug collisions), and `npm run build` + `npm run lint` pass with strict
> TypeScript. Once you've connected a real Supabase project (step 2–5 above),
> click through the app once to confirm everything renders as expected —
> particularly the Add/Edit forms and passcode gate.

## Deploying to Vercel

1. Push this repository to GitHub (if it isn't already).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. In the project's **Environment Variables** settings, add the same four
   variables from your `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `APP_PASSCODE`.
4. Deploy. Every push to your main branch redeploys automatically.

`NEXT_PUBLIC_`-prefixed variables are safe to ship to the browser by design —
that's what the prefix means in Next.js. `SUPABASE_SERVICE_ROLE_KEY` and
`APP_PASSCODE` are not prefixed, so Next.js never bundles them into
client-side JavaScript; they only exist inside Server Actions running on
Vercel's servers.

## Adding another department later

Business Development, Customs Brokerage, Trucking and Haulage (Transportation),
and Warehousing already exist as empty departments — visit one, click
"+ Add sub-department" to create its first sub-department, then "+ Add new
process" inside that to start documenting. No department-specific code exists
anywhere; a fifth department is just another row in `departments`.

## Project structure

```
supabase/
  schema.sql          # tables, indexes, RLS policies, storage bucket
  seed.sql            # real Finance content (T12W + PHE + glossary) + empty departments
  00N_*.sql           # incremental deltas for databases seeded before a given feature existed
src/
  app/
    page.tsx                                  # home: department list
    [deptSlug]/page.tsx                        # sub-department list + department notes
    [deptSlug]/new/page.tsx                    # add-sub-department form
    [deptSlug]/[subSlug]/page.tsx              # process list + Sifu Guide
    [deptSlug]/[subSlug]/new/page.tsx          # add-process form
    [deptSlug]/[subSlug]/[processSlug]/page.tsx        # process detail
    [deptSlug]/[subSlug]/[processSlug]/edit/page.tsx   # edit-process form
    [deptSlug]/[subSlug]/contacts/new/page.tsx         # add Sifu Guide contact
    [deptSlug]/[subSlug]/contacts/[contactId]/edit/page.tsx  # edit contact
    hacks/                                     # standalone hacks board + forms
    glossary/page.tsx
    search/page.tsx
  components/          # ProcessFlow, HackCard, forms, passcode UI
  lib/
    queries.ts          # all read queries (anon key)
    actions.ts           # all Server Actions / mutations (service role key)
    auth.ts               # passcode cookie logic
    supabase/{client,admin}.ts
    types.ts
```
