"use client";
// ============================================================
//  LEAD SCORING (Part 6) + EXPORT (Part 8)
//  Ranked top prospects with component scorecards.
// ============================================================
import { useMemo } from "react";
import { useAdmin } from "./AdminGate";
import { useResponses } from "./useResponses";
import { ResponseRow } from "@/types";

const COMP = [
  { key: "budget_score", label: "Budget" },
  { key: "pain_score", label: "Pain" },
  { key: "reach_score", label: "Reach" },
  { key: "innovation_score", label: "Innov" },
  { key: "meeting_score", label: "Meeting" },
  { key: "pilot_score", label: "Pilot" },
] as const;

const tierColor: Record<string, string> = { cold: "#8a8a99", warm: "#ffd166", hot: "#ff5533", enterprise: "#22d98b" };

export default function Leads() {
  const { pw } = useAdmin();
  const { rows, loading } = useResponses(pw);

  const ranked = useMemo(
    () => [...rows].sort((a, b) => b.pmf_score - a.pmf_score).slice(0, 10),
    [rows]
  );

  const exportPdf = () => window.print();

  if (loading) return <div className="muted text-center py-20">Loading leads…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-head font-extrabold text-3xl mb-1">Lead Scoring</h1>
          <p className="muted">Top 10 highest-value prospects, ranked by PMF.</p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/export?pw=${encodeURIComponent(pw)}`}
            className="bg-card border border-white/10 hover:border-white/30 rounded-full px-4 py-2 text-sm font-head">⬇ CSV / Excel</a>
          <button onClick={exportPdf}
            className="bg-card border border-white/10 hover:border-white/30 rounded-full px-4 py-2 text-sm font-head">⬇ PDF</button>
        </div>
      </div>

      <div className="space-y-3">
        {ranked.map((r, i) => (
          <LeadCard key={r.id} rank={i + 1} r={r} />
        ))}
      </div>
    </div>
  );
}

function LeadCard({ rank, r }: { rank: number; r: ResponseRow }) {
  return (
    <div className="glass rounded-xl2 p-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className="font-head font-extrabold text-2xl muted w-8 shrink-0">#{rank}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-head font-bold">{r.contact_name || "Anonymous"}</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-head font-bold"
            style={{ background: `${tierColor[r.lead_tier]}22`, color: tierColor[r.lead_tier] }}>
            {r.lead_tier.toUpperCase()}
          </span>
          <span className="muted text-xs">{r.persona}</span>
        </div>
        <div className="muted text-xs mt-1 truncate">
          {r.industry} · {r.city} · {r.company_size} · {r.contact_info || "no contact"}
        </div>
        {/* component scorecard */}
        <div className="grid grid-cols-6 gap-2 mt-3">
          {COMP.map((c) => {
            const v = (r[c.key] as number) ?? 0;
            return (
              <div key={c.key}>
                <div className="text-[10px] muted uppercase mb-1">{c.label}</div>
                <div className="h-1.5 bg-card rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${v}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-center shrink-0">
        <div className="font-head font-extrabold text-3xl text-accent">{r.pmf_score}</div>
        <div className="muted text-[10px] uppercase">PMF</div>
      </div>
    </div>
  );
}
