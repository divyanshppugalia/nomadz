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

// ----- PMF SCORE (0-100) ------------------------------------
// Sums the scored questions, mirroring the original matrix.
export function calcPmf(a: SurveyAnswers): number {
  const total =
    scoreOf("monthly_budget", a.monthly_budget) +
    scoreOf("pain_point", a.pain_point) +
    scoreOf("offline_belief", a.offline_belief) +
    scoreOf("ooh_experience", a.ooh_experience) +
    scoreOf("format_reaction", a.format_reaction) +
    scoreOf("pilot_budget", a.pilot_budget) +
    scoreOf("followup_intent", a.followup_intent);
  return Math.min(Math.round(total), 100);
}

// ----- HIGH-INTENT FLAG -------------------------------------
export function isHighIntent(a: SurveyAnswers): boolean {
  return ["3k-10k", "Over10k"].includes(a.pilot_budget ?? "");
}

// ----- ENTERPRISE FLAG --------------------------------------
// Big budget brand willing to spend big on a pilot.
function isEnterprise(a: SurveyAnswers): boolean {
  const bigBudget = ["5k-20k", "Over20k"].includes(a.monthly_budget ?? "");
  const bigPilot = a.pilot_budget === "Over10k";
  const bigCo = a.company_size === "200+";
  return (bigPilot && bigBudget) || (bigBudget && bigCo && a.pilot_budget === "3k-10k");
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
  const budgetMap: Record<string, number> = { Under1k: 20, "1k-5k": 50, "5k-20k": 80, Over20k: 100 };
  const reachMap: Record<string, number> = { HyperLocal: 100, WrongAudience: 80, AdFatigue: 60, ROI: 50, TooExpensive: 40 };
  const innovationMap: Record<string, number> = { PilotNow: 100, InterestedProof: 75, Maybe: 45, Unlikely: 15, No: 0 };
  const meetingMap: Record<string, number> = { YesThisWeek: 100, YesNextMonth: 70, CaseStudiesFirst: 40, NoThanks: 0 };
  const pilotMap: Record<string, number> = { Over10k: 100, "3k-10k": 80, "1k-3k": 55, Upto1k: 30, Nothing: 0 };

  return {
    budget_score: budgetMap[a.monthly_budget ?? ""] ?? 0,
    pain_score: Math.round((scoreOf("pain_point", a.pain_point) / 5) * 100),
    reach_score: reachMap[a.pain_point ?? ""] ?? 30,
    innovation_score: innovationMap[a.format_reaction ?? ""] ?? 0,
    meeting_score: meetingMap[a.followup_intent ?? ""] ?? 0,
    pilot_score: pilotMap[a.pilot_budget ?? ""] ?? 0,
  };
}

// ----- PERSONA ASSIGNMENT -----------------------------------
// Combines industry + size + intent into a human label.
export function calcPersona(a: SurveyAnswers): string {
  const ind = a.industry;
  const size = a.company_size;
  const hot = ["PilotNow", "InterestedProof"].includes(a.format_reaction ?? "");
  const bigBudget = ["5k-20k", "Over20k"].includes(a.monthly_budget ?? "");

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
