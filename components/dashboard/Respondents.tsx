"use client";
// ============================================================
//  RESPONDENTS / ADMIN PANEL (Part 9)
//  Searchable, filterable table of all responses.
// ============================================================
import { useMemo, useState } from "react";
import { useAdmin } from "./AdminGate";
import { useResponses } from "./useResponses";
import { INDUSTRIES, UK_CITIES } from "@/types";

const tierColor: Record<string, string> = { cold: "#8a8a99", warm: "#ffd166", hot: "#ff5533", enterprise: "#22d98b" };

export default function Respondents() {
  const { pw } = useAdmin();
  const { rows, loading } = useResponses(pw);

  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [tier, setTier] = useState("");
  const [size, setSize] = useState("");
  const [minScore, setMinScore] = useState(0);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (industry && r.industry !== industry) return false;
      if (city && r.city !== city) return false;
      if (tier && r.lead_tier !== tier) return false;
      if (size && r.company_size !== size) return false;
      if (r.pmf_score < minScore) return false;
      if (q) {
        const hay = `${r.contact_name ?? ""} ${r.contact_info ?? ""} ${r.persona ?? ""} ${r.industry ?? ""} ${r.city ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, q, industry, city, tier, size, minScore]);

  if (loading) return <div className="muted text-center py-20">Loading respondents…</div>;

  return (
    <div>
      <h1 className="font-head font-extrabold text-3xl mb-1">Respondents</h1>
      <p className="muted mb-5">{filtered.length} of {rows.length} responses shown.</p>

      {/* filters */}
      <div className="glass rounded-xl2 p-4 mb-5 grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
          className="bg-card border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent lg:col-span-2" />
        <Select value={industry} onChange={setIndustry} placeholder="All industries" opts={INDUSTRIES} />
        <Select value={city} onChange={setCity} placeholder="All cities" opts={UK_CITIES} />
        <Select value={tier} onChange={setTier} placeholder="All tiers" opts={["cold", "warm", "hot", "enterprise"]} />
        <Select value={size} onChange={setSize} placeholder="All sizes" opts={["Solo", "2-20", "21-200", "200+"]} />
      </div>
      <div className="flex items-center gap-3 mb-5 text-sm">
        <span className="muted">Min PMF: {minScore}</span>
        <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(+e.target.value)} className="flex-1 accent-[#ff5533]" />
      </div>

      <div className="glass rounded-xl2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left muted border-b border-white/10">
              {["PMF", "Tier", "Name", "Industry", "City", "Size", "Budget", "Pilot", "Persona", "Contact"].map((h) => (
                <th key={h} className="px-3 py-3 font-head text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-3 py-2.5 font-head font-bold text-accent">{r.pmf_score}</td>
                <td className="px-3 py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-head font-bold"
                    style={{ background: `${tierColor[r.lead_tier]}22`, color: tierColor[r.lead_tier] }}>
                    {r.lead_tier}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">{r.contact_name || "—"}</td>
                <td className="px-3 py-2.5">{r.industry}</td>
                <td className="px-3 py-2.5">{r.city}</td>
                <td className="px-3 py-2.5">{r.company_size}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{r.monthly_budget}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{r.pilot_budget}</td>
                <td className="px-3 py-2.5 muted text-xs whitespace-nowrap">{r.persona}</td>
                <td className="px-3 py-2.5 muted text-xs whitespace-nowrap">{r.contact_info || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Select({ value, onChange, placeholder, opts }: { value: string; onChange: (v: string) => void; placeholder: string; opts: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="bg-card border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-accent">
      <option value="">{placeholder}</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
