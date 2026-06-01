"use client";
// ============================================================
//  UK MARKET MAP (Part 7)
//  City bubbles positioned on a stylised UK outline, sized by
//  response volume, coloured by avg PMF. Click for detail.
// ============================================================
import { useMemo, useState } from "react";
import { useAdmin } from "./AdminGate";
import { useResponses } from "./useResponses";
import { ResponseRow } from "@/types";

// Approx relative positions on a 400x520 India canvas.
const CITY_POS: Record<string, { x: number; y: number }> = {
  Delhi: { x: 205, y: 150 },
  DelhiNCR: { x: 230, y: 165 },
  Kolkata: { x: 290, y: 235 },
  Mumbai: { x: 150, y: 290 },
  Pune: { x: 170, y: 305 },
  Hyderabad: { x: 210, y: 320 },
  Bangalore: { x: 200, y: 380 },
  Chennai: { x: 235, y: 390 },
};

function pmfColor(p: number) {
  if (p >= 72) return "#ff5533";
  if (p >= 42) return "#ffd166";
  return "#4dabf7";
}

export default function UKMap() {
  const { pw } = useAdmin();
  const { rows, loading } = useResponses(pw);
  const [selected, setSelected] = useState<string | null>(null);

  const cityStats = useMemo(() => {
    const m: Record<string, ResponseRow[]> = {};
    rows.forEach((r) => { const c = r.city ?? "Other"; (m[c] = m[c] || []).push(r); });
    return Object.fromEntries(
      Object.entries(m).map(([city, rs]) => [
        city,
        {
          count: rs.length,
          avgPmf: Math.round(rs.reduce((s, r) => s + r.pmf_score, 0) / rs.length),
          hot: rs.filter((r) => ["hot", "enterprise"].includes(r.lead_tier)).length,
          industries: Object.entries(
            rs.reduce((a: Record<string, number>, r) => { a[r.industry ?? "Other"] = (a[r.industry ?? "Other"] ?? 0) + 1; return a; }, {})
          ).sort((a, b) => b[1] - a[1]),
          rows: rs,
        },
      ])
    );
  }, [rows]);

  const maxCount = Math.max(1, ...Object.values(cityStats).map((s: any) => s.count));

  if (loading) return <div className="muted text-center py-20">Loading map…</div>;

  const sel = selected ? (cityStats as any)[selected] : null;

  return (
    <div>
      <h1 className="font-head font-extrabold text-3xl mb-1">India Market Map</h1>
      <p className="muted mb-6">Bubble size = response volume · colour = avg PMF. Click a city for detail.</p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="glass rounded-xl2 p-5 flex justify-center">
          <svg viewBox="0 0 400 520" className="w-full max-w-md">
            {/* stylised India silhouette */}
            <path d="M180 110 L210 95 L245 105 L270 95 L260 130 L290 150 L280 185 L300 210 L285 245 L265 270 L255 310 L240 360 L225 410 L210 445 L200 410 L195 360 L185 320 L170 300 L150 285 L165 250 L150 215 L160 175 L150 145 L170 125 Z"
              fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
            {Object.entries(CITY_POS).map(([city, pos]) => {
              const s = (cityStats as any)[city];
              const count = s?.count ?? 0;
              const r = 6 + (count / maxCount) * 26;
              const color = count ? pmfColor(s.avgPmf) : "rgba(255,255,255,0.15)";
              return (
                <g key={city} onClick={() => count && setSelected(city)} style={{ cursor: count ? "pointer" : "default" }}>
                  {count > 0 && <circle cx={pos.x} cy={pos.y} r={r + 4} fill={color} opacity={0.15} />}
                  <circle cx={pos.x} cy={pos.y} r={count ? r : 4} fill={color}
                    stroke={selected === city ? "#fff" : "none"} strokeWidth={2} />
                  <text x={pos.x} y={pos.y - r - 6} textAnchor="middle" fontSize="11"
                    fill="rgba(255,255,255,0.7)" fontFamily="Syne">{city}</text>
                  {count > 0 && <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="11"
                    fill="#fff" fontWeight="bold" fontFamily="Syne">{count}</text>}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="glass rounded-xl2 p-5">
          {!sel ? (
            <div className="muted text-sm h-full flex items-center justify-center text-center">
              Select a city bubble to see its detailed analytics.
            </div>
          ) : (
            <div>
              <div className="font-head font-extrabold text-2xl mb-4">{selected}</div>
              <div className="grid grid-cols-3 gap-2 mb-5">
                <Stat label="Responses" value={sel.count} />
                <Stat label="Avg PMF" value={sel.avgPmf} color={pmfColor(sel.avgPmf)} />
                <Stat label="Hot" value={sel.hot} color="#ff5533" />
              </div>
              <div className="font-head text-xs uppercase muted mb-2">Industry mix</div>
              <div className="space-y-1.5">
                {sel.industries.map(([ind, c]: [string, number]) => (
                  <div key={ind} className="flex justify-between text-sm">
                    <span>{ind}</span><span className="muted">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-card rounded-xl2 p-3 text-center">
      <div className="font-head font-extrabold text-2xl" style={{ color: color ?? "#fff" }}>{value}</div>
      <div className="muted text-[10px] uppercase">{label}</div>
    </div>
  );
}
