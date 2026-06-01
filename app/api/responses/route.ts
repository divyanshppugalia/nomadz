// ============================================================
//  /api/responses
//  POST  -> score + insert a survey response (public)
//  GET   -> list all responses (admin password required)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase";
import { scoreResponse } from "@/lib/scoring";
import { SurveyAnswers } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SurveyAnswers;

    // Server-side scoring — never trust client-sent scores.
    const breakdown = scoreResponse(body);

    const row = {
      industry: body.industry ?? null,
      company_size: body.company_size ?? null,
      monthly_budget: body.monthly_budget ?? null,
      channels: body.channels ?? [],
      pain_point: body.pain_point ?? null,
      offline_belief: body.offline_belief ?? null,
      ooh_experience: body.ooh_experience ?? null,
      format_reaction: body.format_reaction ?? null,
      pilot_budget: body.pilot_budget ?? null,
      followup_intent: body.followup_intent ?? null,
      city: body.city ?? null,
      contact_name: body.contact_name ?? null,
      contact_info: body.contact_info ?? null,
      ...breakdown,
    };

    const sb = serverClient();
    const { data, error } = await sb.from("responses").insert(row).select().single();
    if (error) throw error;

    return NextResponse.json({ ok: true, response: data, breakdown });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const pw = req.headers.get("x-admin-password");
  if (pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const sb = serverClient();
    const { data, error } = await sb.from("responses").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, responses: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
