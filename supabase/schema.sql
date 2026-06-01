-- ============================================================
--  NOMADZ MARKET INTELLIGENCE PLATFORM — SUPABASE SCHEMA
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ----- RESPONSES TABLE --------------------------------------
create table if not exists public.responses (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  -- raw answers
  industry        text,            -- FMCG | Retail | D2C | SaaS | Finance | RealEstate | Education | Automotive | Hospitality | Healthcare | Other
  company_size    text,            -- Solo | 2-20 | 21-200 | 200+
  monthly_budget  text,            -- Under1k | 1k-5k | 5k-20k | Over20k
  channels        text[],          -- multi-select
  pain_point      text,
  offline_belief  text,
  ooh_experience  text,
  format_reaction text,
  pilot_budget    text,            -- Nothing | Upto1k | 1k-3k | 3k-10k | Over10k
  followup_intent text,
  city            text,            -- Mumbai | Delhi | Bangalore | Hyderabad | Pune | Chennai | Kolkata
  other_text      text,            -- free-text when respondent picks "Other" on the pain question

  -- contact (optional)
  contact_name    text,
  contact_info    text,

  -- computed
  pmf_score       int  not null default 0,   -- 0-100
  lead_tier       text not null default 'cold', -- cold | warm | hot | enterprise
  high_intent     boolean not null default false,
  persona         text,            -- auto-assigned persona label

  -- granular lead-scoring components
  budget_score    int default 0,
  pain_score      int default 0,
  reach_score     int default 0,
  innovation_score int default 0,
  meeting_score   int default 0,
  pilot_score     int default 0
);

-- ----- INDEXES ----------------------------------------------
create index if not exists idx_responses_created on public.responses (created_at desc);
create index if not exists idx_responses_tier    on public.responses (lead_tier);
create index if not exists idx_responses_industry on public.responses (industry);
create index if not exists idx_responses_city     on public.responses (city);
create index if not exists idx_responses_score    on public.responses (pmf_score desc);

-- ----- ROW LEVEL SECURITY -----------------------------------
alter table public.responses enable row level security;

-- Anyone (anon) may INSERT a survey response — the public survey needs this.
create policy "public can insert responses"
  on public.responses for insert
  to anon, authenticated
  with check (true);

-- Only authenticated (admin) users may READ responses.
-- The dashboard/admin pages use the service role key on the server,
-- which bypasses RLS, so reads are gated at the app layer (admin login).
create policy "authenticated can read responses"
  on public.responses for select
  to authenticated
  using (true);

-- ----- REALTIME ---------------------------------------------
-- Enable realtime so the dashboard live-updates on new inserts.
alter publication supabase_realtime add table public.responses;

-- ----- AGGREGATE VIEW (optional convenience) ----------------
create or replace view public.city_summary as
select
  coalesce(city, 'Other')                         as city,
  count(*)                                         as response_count,
  round(avg(pmf_score))                            as avg_pmf,
  count(*) filter (where lead_tier in ('hot','enterprise')) as hot_count
from public.responses
group by coalesce(city, 'Other');
