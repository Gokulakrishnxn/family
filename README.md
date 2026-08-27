# Family

A shared household expense tracker backed by Supabase. Everyone in the family
opens the same app, picks their name, enters an amount and a category, and hits
submit. The dashboard adds it all up — by category, by person, and across six
months.

Black and white throughout: every colour token in the theme is zero-chroma, so
nothing in the interface depends on hue to be understood.

## Screens

| Route | What it does |
| --- | --- |
| `/login` | Pick who you are. No password — see the note below. Adding yourself here signs you in. |
| `/` | Add an expense: amount, category, optional note and date, submit. Shows this month's total, today's spend, your share and the latest entries alongside. |
| `/dashboard` | Totals, daily average, entry count, last month, budget progress, spending by category, spending by member, a six-month trend, and recent expenses. Filter by month and by member. |
| `/history` | Every entry as a table — date, category, member, note, amount — with the same filters. |
| `/family` | Add and remove family members, and set the monthly household budget. |

## Sign-in is a profile picker, not authentication

There are no passwords. Choosing a name on `/login` writes an httpOnly cookie so
the device knows whose spending to record; it does not keep anyone out. Anyone
who can open the app can pick any name. That is the right trade for a household
on its own devices, and the wrong one for anything public — if you deploy this to
the open internet, put real auth (Supabase Auth) in front of it.

## Setup

### 1. Environment

```bash
cp .env.example .env.local
```

Fill in from Supabase → Project Settings → API:

- `SUPABASE_URL` — `https://<project-ref>.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` — the `sb_publishable_…` key
- `SUPABASE_SECRET_KEY` — optional, see "Locking it down" below

None of these are `NEXT_PUBLIC_`: every query in this app runs on the server, so
the keys never reach the browser bundle.

### 2. Database schema

Add your database password to `.env.local` (Supabase → Project Settings →
Database → Connection string → URI) and apply the migrations:

```bash
npm run db:push
```

The password stays in your gitignored `.env.local`; it is never passed on a
command line. If you would rather not put it there, paste
`supabase/migrations/20260828120000_init.sql` into the dashboard's SQL Editor —
it does exactly the same thing. The CLI works too:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

The app shows a page telling you which of these two steps is missing until both
are done, so you will not hit a blank 500.

### 3. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. The first screen asks you to add the first person.

```bash
npm run build && npm start   # production
```

## Locking it down

The migration enables row level security and grants the `anon` role full access
to the three tables, because that is what the publishable key authenticates as.
The consequence, stated plainly: **anyone holding both your project URL and your
publishable key can read and write the ledger.**

To close that, put a secret key in `SUPABASE_SECRET_KEY` (the app prefers it
automatically) and change `to anon, authenticated` to `to service_role` in the
three policies at the bottom of the migration.

## How it works

- **Next.js 16** (App Router) with React Server Components. Every mutation is a
  server action in `src/lib/actions.ts`; there is no client-side API layer and
  the browser never talks to Supabase directly.
- **Supabase Postgres** via `@supabase/supabase-js`, server-side only.
- **Money is stored as integer paise** (`bigint`), never floats, so totals do not
  drift. `src/lib/format.ts` is the only place that turns paise into `₹`.
- **The dashboard is one query.** Six months of rows are read in a single paged
  pass and aggregated in JS, rather than a round trip per statistic.
- **Who is signed in** lives in an httpOnly cookie, so each device remembers its
  own person while everyone shares one ledger.

### Layout

```
src/
  app/            routes: login, add (/), dashboard, history, family
  components/     app shell, forms, charts, and shadcn/ui primitives in ui/
  hooks/          use-theme
  lib/
    supabase.ts   client + a setup probe that drives the onboarding page
    queries.ts    every read and write
    actions.ts    server actions (validation lives here)
    session.ts    the active-member cookie and the /login redirect
    categories.ts the twelve spending categories and their icons
    format.ts     money, dates, initials
supabase/
  migrations/     schema, indexes and RLS policies
```

## Design notes

- **Theme.** `src/app/globals.css` defines one neutral ramp. Light is the base;
  dark is re-stepped against a near-black surface rather than flipped. The
  `dark` variant follows `prefers-color-scheme` by default, and a `.light` or
  `.dark` class on `<html>` overrides it — which is why the toggle needs no
  blocking script.
- **Charts.** Each chart shows a single series, so bar *length* carries the whole
  message and every bar wears the same ink; rank never changes a bar's colour.
  Values are labelled directly, hovering gives the exact figure and share, and
  `/history` is the table view of the same data.
- **Icons** come from `lucide-react`, the icon library shadcn/ui is configured
  with (`components.json` → `iconLibrary: "lucide"`).
- **Responsive.** One column and a thumb-reachable bottom tab bar on phones; a
  top nav and multi-column layouts from `md` up. Wide content (the history
  table) scrolls inside its own container so the page never scrolls sideways.
