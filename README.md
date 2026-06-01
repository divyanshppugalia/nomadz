# Nomadz UK — Market Intelligence & PMF Research Platform

A full-stack Next.js + Supabase platform: a Typeform-style survey feeding a
real-time executive dashboard with PMF scoring, AI segmentation, lead scoring,
a UK market map, insights, and CSV/PDF export.

Stack: **Next.js 14 (App Router) · TypeScript · Tailwind · Supabase · Recharts · Framer Motion**

---

## What's inside

| Part | Where |
|------|-------|
| 1. Survey experience | `components/survey/SurveyClient.tsx`, `/` and `/survey` |
| 2. PMF engine (0–100, tiers) | `lib/scoring.ts` |
| 3. AI segmentation / personas | `lib/scoring.ts` → `calcPersona` |
| 4. Executive dashboard | `components/dashboard/Dashboard.tsx`, `/dashboard` |
| 5. Market insights | `components/dashboard/Insights.tsx`, `/insights` |
| 6. Lead scoring + Top 10 | `components/dashboard/Leads.tsx`, `/leads` |
| 7. UK market map | `components/dashboard/UKMap.tsx`, `/map` |
| 8. CSV / Excel / PDF export | `/api/export`, print-to-PDF on `/leads` |
| 9. Admin panel + filters | `components/dashboard/Respondents.tsx`, `/admin` |
| 10. Real-time alerts | Supabase realtime in `useResponses.ts` |
| 11. One central DB | Supabase `responses` table |
| 12. Wow factor (live PMF meter, command centre, gap detector, AI summary, investor view) | survey + dashboard + insights |

---

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it. This creates the `responses` table, indexes, row-level security, the realtime publication, and a city summary view.
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (server-only — keep it private)

## 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=pick-a-strong-password
ANTHROPIC_API_KEY=sk-ant-...   # optional — only for the AI insight toggle
```

- The **anon key** is used in the browser; RLS lets it only INSERT responses.
- The **service-role key** is used only inside API routes (server) to read data.
- `ADMIN_PASSWORD` gates the dashboard/admin pages. It's verified server-side; it never ships in the client bundle.
- `ANTHROPIC_API_KEY` is optional. The Insights page has a Rule-based / AI toggle. Rule-based works with no key. AI mode calls Claude only when the key is present, and falls back to rule-based otherwise.

## 3. Run locally

```bash
npm install
npm run dev
```

- Survey: <http://localhost:3000>
- Dashboard (enter `ADMIN_PASSWORD`): <http://localhost:3000/dashboard>

## 4. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the four (or five) environment variables from `.env.local` in **Project → Settings → Environment Variables**.
4. Deploy.

## 5. Two subdomains (survey + admin)

The survey lives at `/` and the dashboard at `/dashboard`, so you can point both subdomains at the same Vercel project:

1. In **Vercel → Project → Settings → Domains**, add both `survey.nomadz.co.uk` and `admin.nomadz.co.uk`.
2. In your DNS provider, add a `CNAME` for each pointing to `cname.vercel-dns.com` (Vercel shows the exact target).
3. `survey.nomadz.co.uk` serves the survey at its root. For `admin.nomadz.co.uk`, either bookmark `admin.nomadz.co.uk/dashboard`, or add a redirect in `next.config.js`:

```js
async redirects() {
  return [{
    source: "/",
    has: [{ type: "host", value: "admin.nomadz.co.uk" }],
    destination: "/dashboard",
    permanent: false,
  }];
}
```

All responses from any domain flow into the one Supabase table, so both subdomains share a single central dashboard.

---

## Scoring model

PMF score (0–100) sums the scored questions: budget, pain, offline belief, OOH experience, format reaction, pilot budget, and follow-up intent. Tiers: **cold** < 42, **warm** 42–71, **hot** ≥ 72, **enterprise** (big budget + big pilot). High-intent flag fires when pilot budget ≥ £3,000. All scoring runs server-side in `/api/responses` — clients can't forge scores. Edit the weights in `types/index.ts` (option `score` fields) and `lib/scoring.ts`.

## Things to know / next steps

- **PDF export** uses the browser print dialog on the Leads page (clean, no extra dependency). For server-generated branded PDFs, add a library like `@react-pdf/renderer`.
- **Admin auth** is a shared password, verified server-side. For multiple admins with individual logins, swap `AdminGate` for Supabase Auth.
- **Excel**: the CSV export opens directly in Excel/Sheets. For a true `.xlsx`, add `xlsx` (SheetJS) to the export route.
- The UK map uses positioned city bubbles on a stylised outline for speed. To swap in a true geographic boundary map, drop a UK GeoJSON into a `react-simple-maps` component.
