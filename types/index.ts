// ============================================================
//  SHARED TYPES + SURVEY DEFINITION
// ============================================================

export type LeadTier = "cold" | "warm" | "hot" | "enterprise";

export interface SurveyAnswers {
  industry?: string;
  company_size?: string;
  monthly_budget?: string;
  channels?: string[];
  pain_point?: string | string[];
  offline_belief?: string;
  ooh_experience?: string;
  format_reaction?: string;
  pilot_budget?: string;
  followup_intent?: string;
  city?: string;
  contact_name?: string;
  contact_info?: string;
}

export interface ScoreBreakdown {
  pmf_score: number;
  lead_tier: LeadTier;
  high_intent: boolean;
  persona: string;
  budget_score: number;
  pain_score: number;
  reach_score: number;
  innovation_score: number;
  meeting_score: number;
  pilot_score: number;
}

export interface ResponseRow extends SurveyAnswers, ScoreBreakdown {
  id: string;
  created_at: string;
}

// ----- OPTION TYPE ------------------------------------------
export interface Option {
  val: string;
  label: string;
  sub?: string;
  score?: number;
}

export interface Question {
  id: keyof SurveyAnswers;
  section: string;
  type: "single" | "multi";
  text: string;
  hint?: string;
  max?: number;
  options: Option[];
  contact?: boolean; // last question shows contact fields
}

// ============================================================
//  THE SURVEY — UK MARKET ADAPTATION
//  Scoring preserved from the original Nomadz matrix.
// ============================================================
export const QUESTIONS: Question[] = [
  {
    id: "industry",
    section: "About Your Business",
    type: "single",
    text: "What industry does your business operate in?",
    options: [
      { val: "FMCG", label: "FMCG / Consumer goods" },
      { val: "Retail", label: "Retail (in-store / chains)" },
      { val: "D2C", label: "E-commerce / D2C brand" },
      { val: "SaaS", label: "SaaS / Software" },
      { val: "Finance", label: "Finance / FinTech / Insurance" },
      { val: "RealEstate", label: "Real estate / Property" },
      { val: "Education", label: "Education / EdTech" },
      { val: "Automotive", label: "Automotive" },
      { val: "Hospitality", label: "Hospitality / Food & Beverage" },
      { val: "Healthcare", label: "Healthcare / Wellness" },
      { val: "Other", label: "Other" },
    ],
  },
  {
    id: "company_size",
    section: "About Your Business",
    type: "single",
    text: "How large is your company?",
    options: [
      { val: "Solo", label: "Solo / freelancer" },
      { val: "2-20", label: "2–20 employees" },
      { val: "21-200", label: "21–200 employees" },
      { val: "200+", label: "200+ employees" },
    ],
  },
  {
    id: "monthly_budget",
    section: "Marketing Spend",
    type: "single",
    text: "What is your monthly marketing budget?",
    options: [
      { val: "Under5k", label: "Under ₹5,000", score: 3 },
      { val: "5k-10k", label: "₹5,000–₹10,000", score: 12 },
      { val: "10k-20k", label: "₹10,000–₹20,000", score: 20 },
      { val: "Over20k", label: "Over ₹20,000", score: 25 },
    ],
  },
  {
    id: "channels",
    section: "Marketing Spend",
    type: "multi",
    max: 3,
    hint: "Select up to 3 options",
    text: "Which channels take the largest share of your budget?",
    options: [
      { val: "SocialMedia", label: "Social media (Meta, Instagram, TikTok)" },
      { val: "SearchAds", label: "Search ads (Google)" },
      { val: "Influencer", label: "Influencer / creator marketing" },
      { val: "Outdoor", label: "Outdoor / billboards / hoardings" },
      { val: "PrintTVRadio", label: "Print / TV / radio" },
      { val: "WOM", label: "Word of mouth / referrals only" },
    ],
  },
  {
    id: "pain_point",
    section: "Pain Points",
    type: "multi",
    max: 2,
    hint: "Select up to 2 options",
    text: "What is your biggest frustration with advertising today?",
    options: [
      { val: "ROI", label: "Can't measure ROI clearly", sub: "Spend money, don't know if it's working", score: 5 },
      { val: "WrongAudience", label: "Hard to reach the right audience", sub: "Ads shown to wrong people", score: 3 },
      { val: "TooExpensive", label: "Too expensive for the results", sub: "CPMs and CPCs keep rising", score: 2 },
      { val: "AdFatigue", label: "People ignore or skip ads", sub: "Banner blindness, ad fatigue", score: 3 },
      { val: "HyperLocal", label: "Can't target specific city areas", sub: "Need hyperlocal reach", score: 4 },
    ],
  },
  {
    id: "offline_belief",
    section: "Offline Advertising",
    type: "single",
    text: "Do you believe physical / offline advertising still works for brands today?",
    options: [
      { val: "YesWorks", label: "Yes — works consistently well", sub: "Physical ads drive real recall and footfall", score: 12 },
      { val: "YesIfTrackable", label: "Yes — but only if you can track it", sub: "The problem is measurement, not the medium", score: 18 },
      { val: "NotSure", label: "Not sure — haven't tried it recently", score: 5 },
      { val: "NoDigital", label: "No — digital is where attention lives now", score: 0 },
    ],
  },
  {
    id: "ooh_experience",
    section: "Offline Advertising",
    type: "single",
    text: "Have you run any outdoor advertising campaign in the last 2 years?",
    options: [
      { val: "YesGood", label: "Yes — and it delivered good results", score: 8 },
      { val: "YesHard", label: "Yes — but results were hard to measure", score: 6 },
      { val: "NoOpen", label: "No — but I'm open to trying", score: 5 },
      { val: "NoNotRelevant", label: "No — not relevant for our category", score: 0 },
    ],
  },
  {
    id: "format_reaction",
    section: "New Format",
    type: "single",
    text: "Imagine a moving ad format that covers the entire city — major roads, high streets, residential areas — every day, with verified data on how many people saw it and where. How would you react?",
    options: [
      { val: "PilotNow", label: "I'd want to pilot it immediately", sub: "Send me details now", score: 28 },
      { val: "InterestedProof", label: "Interested — need pricing and proof first", sub: "Open to a conversation", score: 20 },
      { val: "Maybe", label: "Maybe — depends on cost and credibility", sub: "Need a strong case before committing", score: 10 },
      { val: "Unlikely", label: "Unlikely — not a priority right now", score: 3 },
      { val: "No", label: "No — doesn't fit our strategy", score: 0 },
    ],
  },
  {
    id: "pilot_budget",
    section: "New Format",
    type: "single",
    text: "If the format had strong proof — what budget would you allocate for a 30-day test?",
    options: [
      { val: "Nothing", label: "Nothing — not open to testing new formats", score: 0 },
      { val: "Under5k", label: "Under ₹5,000", score: 5 },
      { val: "5k-10k", label: "₹5,000–₹10,000", score: 10 },
      { val: "10k-20k", label: "₹10,000–₹20,000", score: 16 },
      { val: "Over20k", label: "Over ₹20,000", score: 22 },
    ],
  },
  {
    id: "city",
    section: "Location",
    type: "single",
    text: "Which city is your primary market?",
    options: [
      { val: "Mumbai", label: "Mumbai" },
      { val: "Delhi", label: "Delhi" },
      { val: "DelhiNCR", label: "Delhi NCR" },
      { val: "Bangalore", label: "Bangalore" },
      { val: "Hyderabad", label: "Hyderabad" },
      { val: "Pune", label: "Pune" },
      { val: "Chennai", label: "Chennai" },
      { val: "Kolkata", label: "Kolkata" },
      { val: "Other", label: "Other / nationwide" },
    ],
  },
  {
    id: "followup_intent",
    section: "Follow-up",
    type: "single",
    contact: true,
    text: "If we share results from other brands in your industry using this format, would you be open to a 15-minute call?",
    options: [
      { val: "YesThisWeek", label: "Yes — reach out this week", score: 10 },
      { val: "YesNextMonth", label: "Yes — but next month works better", score: 7 },
      { val: "CaseStudiesFirst", label: "Send me the case studies first, then I'll decide", score: 4 },
      { val: "NoThanks", label: "No thanks", score: 0 },
    ],
  },
];

export const INDUSTRIES = [
  "FMCG", "Retail", "D2C", "SaaS", "Finance",
  "RealEstate", "Education", "Automotive", "Hospitality", "Healthcare",
];

export const UK_CITIES = [
  "Mumbai", "Delhi", "DelhiNCR", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata",
];
