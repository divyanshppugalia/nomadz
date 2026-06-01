// ============================================================
//  SCORING ENGINE — PMF, TIER, PERSONA, LEAD COMPONENTS
//  Pure functions, shared by client (live meter) and server.
// ============================================================
import { QUESTIONS, SurveyAnswers, ScoreBreakdown, LeadTier } from "@/types";

// Map of val -> score for every scored question, built once.
const SCORE_MAP: Record<string, Record<string, number>> = {};
for (const q of QUESTIONS) {
  SCORE_MAP[q.id as string] = {};
  for (const o of q.options) {
    if (typeof o.score === "number") SCORE_MAP[q.id as string][o.val] = o.score;
  }
}

function scoreOf(qid: string, val?: string): number {
  if (!val) return 0;
  return SCORE_MAP[qid]?.[val] ?? 0;
}

// Budgets are now slider values stored as numeric strings (e.g. "150000").
function budgetNum(val?: string): number {
  if (!val) return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

// Monthly budget → PMF points (0-25), scaled by spend.
function monthlyBudgetScore(val?: string): number {
  const n = budgetNum(val);
  if (n >= 200000) return 25;
  if (n >= 50000) return 20;
  if (n >= 20000) return 14;
  if (n >= 10000) return 10;
  if (n >= 5000) return 6;
  return 2;
}

// Pilot budget → PMF points (0-22), scaled by willingness to spend on a test.
function pilotBudgetScore(val?: string): number {
  const n = budgetNum(val);
  if (n >= 100000) return 22;
  if (n >= 50000) return 18;
  if (n >= 20000) return 14;
  if (n >= 10000) return 10;
  if (n >= 5000) return 5;
  return 0;
}

// Pain point can now be multiple selections — sum their scores.
function painScoreTotal(pain?: string | string[]): number {
  if (!pain) return 0;
  const arr = Array.isArray(pain) ? pain : [pain];
  return arr.reduce((s, p) => s + scoreOf("pain_point", p), 0);
}

// ----- PMF SCORE (0-100) ------------------------------------
// Sums the scored questions, mirroring the original matrix.
export function calcPmf(a: SurveyAnswers): number {
  const total =
    monthlyBudgetScore(a.monthly_budget) +
    painScoreTotal(a.pain_point) +
    scoreOf("offline_belief", a.offline_belief) +
    scoreOf("ooh_experience", a.ooh_experience) +
    scoreOf("format_reaction", a.format_reaction) +
    pilotBudgetScore(a.pilot_budget) +
    scoreOf("followup_intent", a.followup_intent);
  return Math.min(Math.round(total), 100);
}

// ----- HIGH-INTENT FLAG -------------------------------------
export function isHighIntent(a: SurveyAnswers): boolean {
  return budgetNum(a.pilot_budget) >= 20000;
}

// ----- ENTERPRISE FLAG --------------------------------------
// Big budget brand willing to spend big on a pilot.
function isEnterprise(a: SurveyAnswers): boolean {
  const bigBudget = budgetNum(a.monthly_budget) >= 50000;
  const bigPilot = budgetNum(a.pilot_budget) >= 100000;
  const bigCo = a.company_size === "200+";
  return (bigPilot && bigBudget) || (bigBudget && bigCo && budgetNum(a.pilot_budget) >= 50000);
}

// ----- TIER -------------------------------------------------
export function calcTier(score: number, a: SurveyAnswers): LeadTier {
  if (isEnterprise(a)) return "enterprise";
  if (score >= 72) return "hot";
  if (score >= 42) return "warm";
  return "cold";
}

// ----- LEAD-SCORING COMPONENTS (0-100 each, normalised) -----
function leadComponents(a: SurveyAnswers) {
  const reachMap: Record<string, number> = { HyperLocal: 100, WrongAudience: 80, AdFatigue: 60, ROI: 50, TooExpensive: 40, Other: 50 };
  const innovationMap: Record<string, number> = { PilotNow: 100, InterestedProof: 75, Maybe: 45, Unlikely: 15, No: 0 };
  const meetingMap: Record<string, number> = { YesThisWeek: 100, YesNextMonth: 70, CaseStudiesFirst: 40, NoThanks: 0 };

  // budget scores scale 0-100 with the slider amount
  const budgetScore = Math.min(Math.round((budgetNum(a.monthly_budget) / 200000) * 100), 100);
  const pilotScore = Math.min(Math.round((budgetNum(a.pilot_budget) / 100000) * 100), 100);

  // pain can be multiple — take the strongest reach signal among them
  const pains = Array.isArray(a.pain_point) ? a.pain_point : a.pain_point ? [a.pain_point] : [];
  const reach = pains.length ? Math.max(...pains.map((p) => reachMap[p] ?? 30)) : 30;
  const painPts = Math.min(painScoreTotal(a.pain_point), 5);

  return {
    budget_score: budgetScore,
    pain_score: Math.round((painPts / 5) * 100),
    reach_score: reach,
    innovation_score: innovationMap[a.format_reaction ?? ""] ?? 0,
    meeting_score: meetingMap[a.followup_intent ?? ""] ?? 0,
    pilot_score: pilotScore,
  };
}

// ----- PERSONA ASSIGNMENT -----------------------------------
// Combines industry + size + intent into a human label.
export function calcPersona(a: SurveyAnswers): string {
  const ind = a.industry;
  const size = a.company_size;
  const hot = ["PilotNow", "InterestedProof"].includes(a.format_reaction ?? "");
  const bigBudget = budgetNum(a.monthly_budget) >= 50000;

  if (bigBudget && size === "200+") return "High-Spend Enterprise Marketer";
  if (ind === "D2C" && hot) return "Growth-Hungry D2C Founder";
  if (ind === "Retail") return "Regional Retail Chain";
  if (ind === "FMCG") return "Traditional Brand Manager";
  if (ind === "SaaS") return "Performance-Led SaaS Marketer";
  if (ind === "RealEstate") return "Local Property Marketer";
  if (ind === "Hospitality") return "Footfall-Driven Hospitality Brand";
  if (ind === "Automotive") return "Dealer Network Marketer";
  if (ind === "Healthcare") return "Trust-First Healthcare Brand";
  if (ind === "Education") return "Enrolment-Driven Education Marketer";
  if (ind === "Finance") return "Compliance-Aware Finance Marketer";
  if (size === "Solo" || size === "2-20") return "Scrappy Early-Stage Operator";
  return "Exploratory Marketer";
}

// ----- FULL BREAKDOWN ---------------------------------------
export function scoreResponse(a: SurveyAnswers): ScoreBreakdown {
  const pmf_score = calcPmf(a);
  const lead_tier = calcTier(pmf_score, a);
  const components = leadComponents(a);
  return {
    pmf_score,
    lead_tier,
    high_intent: isHighIntent(a),
    persona: calcPersona(a),
    ...components,
  };
}
