// ============================================================
//  /api/export  -> streams a CSV of all responses (admin only)
//  CSV/Excel both open this; PDF export is generated client-side.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const COLS = [
  "created_at", "industry", "company_size", "monthly_budget", "channels",
  "pain_point", "offline_belief", "ooh_experience", "format_reaction",
  "pilot_budget", "followup_intent", "city", "contact_name", "contact_info",
  "pmf_score", "lead_tier", "high_intent", "persona",
  "budget_score", "pain_score", "reach_score", "innovation_score", "meeting_score", "pilot_score",
];

function csvCell(v: any): string {
  if (Array.isArray(v)) v = v.join("|");
  if (v === null || v === undefined) v = "";
  return `"${String(v).replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const pw = req.nextUrl.searchParams.get("pw");
  if (pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const sb = serverClient();
  const { data, error } = await sb.from("responses").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const header = COLS.join(",");
  const lines = (data || []).map((r: any) => COLS.map((c) => csvCell(r[c])).join(","));
  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="nomadz_responses_${Date.now()}.csv"`,
    },
  });
}
