// ============================================================
//  INSIGHTS ENGINE (rule-based)
//  Generates executive market-research insights from response rows.
//  This is the "Both" toggle's offline path — no API key needed.
//  The LLM path lives in app/api/insights/route.ts.
// ============================================================
import { ResponseRow } from "@/types";

export interface Insight {
  stat: string;       // e.g. "72%"
  text: string;       // human sentence
  tone: "positive" | "neutral" | "watch";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

export function generateInsights(rows: ResponseRow[]): Insight[] {
  const out: Insight[] = [];
  const n = rows.length;
  if (n === 0) return out;

  // 1. ROI measurement pain
  const roiPain = rows.filter((r) => {
    const pp = r.pain_point;
    return Array.isArray(pp) ? pp.includes("ROI") : pp === "ROI";
  }).length;
  if (roiPain > 0)
    out.push({
      stat: `${pct(roiPain, n)}%`,
      text: `of brands say their biggest frustration is being unable to measure offline ROI clearly.`,
      tone: "positive",
    });

  // 2. High spenders
  const highSpend = rows.filter((r) => ["10k-20k", "Over20k"].includes(r.monthly_budget ?? "")).length;
  out.push({
    stat: `${pct(highSpend, n)}%`,
    text: `of respondents spend more than £5,000 per month on marketing.`,
    tone: highSpend / n > 0.4 ? "positive" : "neutral",
  });

  // 3. Strongest industries (by avg PMF)
  const byInd: Record<string, { sum: number; c: number }> = {};
  rows.forEach((r) => {
    const k = r.industry ?? "Other";
    byInd[k] = byInd[k] || { sum: 0, c: 0 };
    byInd[k].sum += r.pmf_score;
    byInd[k].c += 1;
  });
  const indRank = Object.entries(byInd)
    .filter(([, v]) => v.c >= 2)
    .map(([k, v]) => ({ k, avg: Math.round(v.sum / v.c) }))
    .sort((a, b) => b.avg - a.avg);
  if (indRank.length >= 1) {
    const top = indRank.slice(0, 2).map((x) => x.k).join(" and ");
    out.push({ stat: `${indRank[0].avg}`, text: `${top} show the strongest product-market fit (highest average PMF score).`, tone: "positive" });
  }

  // 4. Top city by concentration
  const byCity: Record<string, number> = {};
  rows.forEach((r) => {
    const c = r.city ?? "Other";
    byCity[c] = (byCity[c] ?? 0) + 1;
  });
  const topCity = Object.entries(byCity).sort((a, b) => b[1] - a[1])[0];
  if (topCity)
    out.push({ stat: `${pct(topCity[1], n)}%`, text: `${topCity[0]} shows the highest concentration of interested brands.`, tone: "neutral" });

  // 5. Openness to offline (only-if-trackable)
  const trackable = rows.filter((r) => r.offline_belief === "YesIfTrackable").length;
  if (trackable > 0)
    out.push({
      stat: `${pct(trackable, n)}%`,
      text: `believe offline advertising works — but only if results can be tracked. Measurement is the unlock, not the medium.`,
      tone: "positive",
    });

  // 6. Pilot willingness
  const willing = rows.filter((r) => !["Nothing"].includes(r.pilot_budget ?? "")).length;
  out.push({ stat: `${pct(willing, n)}%`, text: `are willing to allocate budget to a 30-day pilot if proof is provided.`, tone: "positive" });

  // 7. Hot lead rate
  const hot = rows.filter((r) => ["hot", "enterprise"].includes(r.lead_tier)).length;
  out.push({ stat: `${pct(hot, n)}%`, text: `of all respondents qualify as hot leads or enterprise opportunities.`, tone: hot / n > 0.2 ? "positive" : "watch" });

  return out;
}

// ----- INDUSTRY GAP DETECTOR --------------------------------
// Industries with high intent but low response volume = underserved.
export function industryGaps(rows: ResponseRow[]) {
  const map: Record<string, { c: number; avg: number; sum: number }> = {};
  rows.forEach((r) => {
    const k = r.industry ?? "Other";
    map[k] = map[k] || { c: 0, avg: 0, sum: 0 };
    map[k].c += 1;
    map[k].sum += r.pmf_score;
  });
  return Object.entries(map)
    .map(([k, v]) => ({ industry: k, count: v.c, avgPmf: Math.round(v.sum / v.c), gap: Math.round((v.sum / v.c) / Math.max(v.c, 1)) }))
    .sort((a, b) => b.gap - a.gap);
}

// ----- INVESTOR-GRADE EXECUTIVE SUMMARY (rule-based) --------
export function executiveSummary(rows: ResponseRow[]): string {
  const n = rows.length;
  if (n === 0) return "No responses collected yet. Share the survey to begin gathering market validation data.";
  const avgPmf = Math.round(rows.reduce((s, r) => s + r.pmf_score, 0) / n);
  const hot = rows.filter((r) => ["hot", "enterprise"].includes(r.lead_tier)).length;
  const willing = rows.filter((r) => r.pilot_budget !== "Nothing").length;
  const byInd: Record<string, number> = {};
  rows.forEach((r) => (byInd[r.industry ?? "Other"] = (byInd[r.industry ?? "Other"] ?? 0) + 1));
  const topInd = Object.entries(byInd).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return `Across ${n} responses, Nomadz UK shows an average product-market-fit score of ${avgPmf}/100. ${pct(
    hot,
    n
  )}% of respondents qualify as hot or enterprise opportunities, and ${pct(
    willing,
    n
  )}% are willing to fund a paid pilot given proof of performance. The strongest category by volume is ${topInd}. The dominant pain point is measurement of offline ROI — directly addressable by Nomadz's verified-impressions model. This validates demand for a trackable mobile out-of-home format in the UK market.`;
}
