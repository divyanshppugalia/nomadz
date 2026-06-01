"use client";
// ============================================================
//  INSIGHTS PAGE (Part 5 + Part 12)
//  Auto-generated insights, AI/rule toggle, industry gap
//  detector, persona cards, investor-grade summary.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "./AdminGate";
import { useResponses } from "./useResponses";
import { generateInsights, industryGaps } from "@/lib/insights";

export default function Insights() {
  const { pw } = useAdmin();
  const { rows, loading } = useResponses(pw);
  const [mode, setMode] = useState<"rule" | "ai">("rule");
  const [summary, setSummary] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [usedMode, setUsedMode] = useState("");

  const insights = useMemo(() => generateInsights(rows), [rows]);
  const gaps = useMemo(() => industryGaps(rows), [rows]);
  const personas = useMemo(() => {
    const m: Record<string, { count: number; pmf: number }> = {};
    rows.forEach((r) => { const k = r.persona || "—"; m[k] = m[k] || { count: 0, pmf: 0 }; m[k].count++; m[k].pmf += r.pmf_score; });
    return Object.entries(m).map(([name, v]) => ({ name, count: v.count, avgPmf: Math.round(v.pmf / v.count) })).sort((a, b) => b.count - a.count);
  }, [rows]);

  const genSummary = async () => {
    setGenLoading(true);
    const res = await fetch("/api/insights", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ rows, mode }),
    });
    const json = await res.json();
    setSummary(json.summary);
    setUsedMode(json.mode);
    setGenLoading(false);
  };

  useEffect(() => { if (rows.length) genSummary(); /* eslint-disable-next-line */ }, [rows.length, mode]);

  if (loading) return <div className="muted text-center py-20">Loading insights…</div>;

  return (
    <div>
      <h1 className="font-head font-extrabold text-3xl mb-1">Market Research Insights</h1>
      <p className="muted mb-6">Auto-generated from {rows.length} responses.</p>

      {/* executive summary + toggle */}
      <div className="glass rounded-xl2 p-6 mb-8">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div className="font-head font-bold text-lg">Investor-Grade Executive Summary</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="muted">Engine:</span>
            <div className="flex rounded-full bg-card p-1 border border-white/10">
              {(["rule", "ai"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-3 py-1 rounded-full font-head text-xs ${mode === m ? "bg-accent text-white" : "muted"}`}>
                  {m === "rule" ? "Rule-based" : "AI"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="leading-relaxed">{genLoading ? "Generating…" : summary}</p>
        {usedMode === "rule" && mode === "ai" && (
          <p className="text-xs muted mt-3">No AI key configured — showing rule-based summary. Add ANTHROPIC_API_KEY to enable AI.</p>
        )}
      </div>

      {/* insight stat cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {insights.map((ins, i) => (
          <div key={i} className="glass rounded-xl2 p-5">
            <div className="font-head font-extrabold text-3xl mb-1"
              style={{ color: ins.tone === "positive" ? "#22d98b" : ins.tone === "watch" ? "#ffd166" : "#ff8c42" }}>
              {ins.stat}
            </div>
            <p className="text-sm muted leading-snug">{ins.text}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* industry gap detector */}
        <div className="glass rounded-xl2 p-5">
          <div className="font-head font-bold mb-1">Industry Gap Detector</div>
          <p className="muted text-xs mb-4">High intent + low volume = underserved opportunity.</p>
          <div className="space-y-2">
            {gaps.map((g) => (
              <div key={g.industry} className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                <span>{g.industry}</span>
                <span className="flex gap-4 muted">
                  <span>{g.count} resp</span>
                  <span className="text-accent2 font-head font-bold w-10 text-right">{g.avgPmf} PMF</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* persona cards */}
        <div className="glass rounded-xl2 p-5">
          <div className="font-head font-bold mb-1">Auto-Generated Personas</div>
          <p className="muted text-xs mb-4">Respondents classified into customer archetypes.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {personas.map((p) => (
              <div key={p.name} className="bg-card border border-white/10 rounded-xl2 p-3">
                <div className="font-head font-bold text-sm leading-tight mb-2">{p.name}</div>
                <div className="flex justify-between text-xs muted">
                  <span>{p.count} people</span>
                  <span className="text-accent2 font-head font-bold">{p.avgPmf} PMF</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
