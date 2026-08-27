# Family

A shared household expense tracker. Everyone in the family opens the same app,
picks their name, enters an amount and a category, and hits submit. The dashboard
adds it all up — by category, by person, and across six months.

Black and white throughout: every colour token in the theme is zero-chroma, so
nothing in the interface depends on hue to be understood.

## Screens

| Route | What it does |
| --- | --- |
| `/` | Add an expense: pick who spent it, enter the amount, choose a category, submit. Shows this month's total, today's spend and the latest entries alongside. |
| `/dashboard` | Totals, daily average, entry count, last month, budget progress, spending by category, spending by member, a six-month trend, and recent expenses. Filter by month and by member. |
| `/history` | Every entry as a table — date, category, member, note, amount — with the same filters. |
| `/family` | Add and remove family members, and set the monthly household budget. |

## Running it

```bash
npm install
npm run seed     # optional: six months of demo spending so the dashboard has something to show
npm run dev
```

Then open http://localhost:3000.

To let the rest of the household use it, run it on one machine on your home
network and share that machine's LAN address (`npm run dev -- -H 0.0.0.0`, then
`http://<that-machine-ip>:3000`), or deploy it to a host with a persistent disk.

```bash
npm run build && npm start   # production
```

## How it works

- **Next.js 16** (App Router) with React Server Components. Every mutation is a
  server action in `src/lib/actions.ts`; there is no client-side API layer.
- **SQLite** through Node's built-in `node:sqlite` — no native modules to
  compile. The database lives at `data/family.db` (override with
  `FAMILY_DB_PATH`) and is gitignored, since it holds your household's spending.
- **Money is stored as integer paise**, never floats, so totals do not drift.
  `src/lib/format.ts` is the only place that turns paise into `₹`.
- **Who is logging** is kept in a cookie, so each device remembers its own
  person while everyone shares one ledger.

### Layout

```
src/
  app/            routes: add (/), dashboard, history, family
  components/     app shell, forms, charts, and shadcn/ui primitives in ui/
  hooks/          use-theme
  lib/
    db.ts         connection + schema
    queries.ts    every read and write
    actions.ts    server actions (validation lives here)
    categories.ts the twelve spending categories and their icons
    format.ts     money, dates, initials
scripts/seed.mjs  demo data
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
