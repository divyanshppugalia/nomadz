// ============================================================
//  /api/insights
//  POST -> executive summary. mode = "ai" uses Anthropic API,
//          mode = "rule" (or no key) uses the rule-based engine.
//  The dashboard toggle decides which mode to request.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { executiveSummary } from "@/lib/insights";
import { ResponseRow } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const pw = req.headers.get("x-admin-password");
  if (pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { rows, mode } = (await req.json()) as { rows: ResponseRow[]; mode: "ai" | "rule" };

  // Rule-based path — always works, no key required.
  if (mode !== "ai" || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: true, mode: "rule", summary: executiveSummary(rows) });
  }

  // LLM path.
  try {
    const compact = rows.map((r) => ({
      industry: r.industry,
      city: r.city,
      budget: r.monthly_budget,
      pain: r.pain_point,
      pmf: r.pmf_score,
      tier: r.lead_tier,
      pilot: r.pilot_budget,
    }));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: `You are a market-research analyst for Nomadz, a UK mobile out-of-home (ads on vehicles) advertising company. Below is anonymised survey data as JSON. Write a concise, investor-grade executive summary (4-6 sentences) covering: market demand, product-market fit, strongest industries, pain points, and pilot willingness. Be specific with percentages where the data supports it. Data: ${JSON.stringify(
              compact
            )}`,
          },
        ],
      }),
    });
    const data = await res.json();
    const summary = (data.content || [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();
    return NextResponse.json({ ok: true, mode: "ai", summary: summary || executiveSummary(rows) });
  } catch (e: any) {
    // graceful fallback
    return NextResponse.json({ ok: true, mode: "rule", summary: executiveSummary(rows), note: e.message });
  }
}
