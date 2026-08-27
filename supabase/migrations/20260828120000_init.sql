-- Family — household expense ledger.
--
-- One shared ledger per household: members, the expenses they log, and a small
-- key/value table for settings such as the monthly budget.

create extension if not exists pgcrypto;

-- Members -------------------------------------------------------------------

create table if not exists public.members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 2 and 40),
  role       text not null default '',
  created_at timestamptz not null default now()
);

-- Expenses ------------------------------------------------------------------
-- `amount` is integer paise, never a float, so totals do not drift.

create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.members(id) on delete cascade,
  amount     bigint not null check (amount > 0),
  category   text not null,
  note       text not null default '',
  spent_at   date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists expenses_spent_at_idx  on public.expenses (spent_at desc);
create index if not exists expenses_member_id_idx on public.expenses (member_id);

-- Settings ------------------------------------------------------------------

create table if not exists public.settings (
  key   text primary key,
  value text not null
);

-- Row level security --------------------------------------------------------
--
-- This app has no per-user authentication: the household picks a name on the
-- way in and everyone shares one ledger. The Next.js server talks to Supabase
-- with the publishable key, so these policies grant that key full access.
--
-- The consequence, stated plainly: anyone who has BOTH the project URL and the
-- publishable key can read and write this ledger. To lock it down, put a secret
-- key in SUPABASE_SECRET_KEY (server-side only — it is never sent to the
-- browser) and then replace `to anon, authenticated` with `to service_role`
-- in the three policies below.

alter table public.members  enable row level security;
alter table public.expenses enable row level security;
alter table public.settings enable row level security;

drop policy if exists "household access" on public.members;
create policy "household access" on public.members
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "household access" on public.expenses;
create policy "household access" on public.expenses
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "household access" on public.settings;
create policy "household access" on public.settings
  for all to anon, authenticated using (true) with check (true);
