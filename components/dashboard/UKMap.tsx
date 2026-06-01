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

// Approx relative positions on a 400x520 UK canvas.
const CITY_POS: Record<string, { x: number; y: number }> = {
  London: { x: 255, y: 400 },
  Manchester: { x: 200, y: 290 },
  Birmingham: { x: 210, y: 340 },
  Leeds: { x: 230, y: 270 },
  Liverpool: { x: 175, y: 295 },
  Glasgow: { x: 165, y: 150 },
  Bristol: { x: 180, y: 385 },
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
      <h1 className="font-head font-extrabold text-3xl mb-1">UK Market Map</h1>
      <p className="muted mb-6">Bubble size = response volume · colour = avg PMF. Click a city for detail.</p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="glass rounded-xl2 p-5 flex justify-center">
          <svg viewBox="0 0 400 520" className="w-full max-w-md">
            {/* stylised UK silhouette */}
            <path d="M150 90 L185 70 L200 110 L240 120 L225 160 L255 175 L240 215 L270 235 L250 290 L285 320 L260 360 L290 400 L255 440 L230 420 L210 450 L195 415 L165 405 L185 360 L160 330 L185 300 L150 280 L175 240 L150 215 L170 180 L145 150 Z"
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
