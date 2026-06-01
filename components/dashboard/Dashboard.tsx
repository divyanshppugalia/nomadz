"use client";
// ============================================================
//  EXECUTIVE DASHBOARD / FOUNDER COMMAND CENTRE
//  KPI cards + Recharts (pie, bar, funnel, radar, line) +
//  live hot-lead alerts. Everything updates in realtime.
// ============================================================
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, FunnelChart, Funnel, LabelList,
} from "recharts";
import { useAdmin } from "./AdminGate";
import { useResponses } from "./useResponses";
import { ResponseRow } from "@/types";

const PALETTE = ["#ff5533", "#ff8c42", "#ffd166", "#22d98b", "#4dabf7", "#b197fc", "#f783ac", "#63e6be", "#ffa94d", "#74c0fc"];

function groupCount<T>(rows: T[], key: (r: T) => string) {
  const m: Record<string, number> = {};
  rows.forEach((r) => { const k = key(r) || "—"; m[k] = (m[k] ?? 0) + 1; });
  return Object.entries(m).map(([name, value]) => ({ name, value }));
}

const BUDGET_ORDER = ["Under1k", "1k-5k", "5k-20k", "Over20k"];
const BUDGET_LABEL: Record<string, string> = { Under1k: "<£1k", "1k-5k": "£1–5k", "5k-20k": "£5–20k", Over20k: ">£20k" };

export default function Dashboard() {
  const { pw } = useAdmin();
  const { rows, loading, alert, dismissAlert } = useResponses(pw);

  const kpis = useMemo(() => {
    const n = rows.length;
    const avgPmf = n ? Math.round(rows.reduce((s, r) => s + r.pmf_score, 0) / n) : 0;
    const hot = rows.filter((r) => ["hot", "enterprise"].includes(r.lead_tier)).length;
    const warm = rows.filter((r) => r.lead_tier === "warm").length;
    const highBudget = rows.filter((r) => ["5k-20k", "Over20k"].includes(r.monthly_budget ?? "")).length;
    const meetings = rows.filter((r) => ["YesThisWeek", "YesNextMonth"].includes(r.followup_intent ?? "")).length;
    return { n, avgPmf, hot, warm, highBudget, meetings };
  }, [rows]);

  const industryData = useMemo(() => groupCount(rows, (r) => r.industry ?? "Other"), [rows]);
  const sizeData = useMemo(() => groupCount(rows, (r) => r.company_size ?? "—"), [rows]);
  const channelData = useMemo(() => {
    const m: Record<string, number> = {};
    rows.forEach((r) => (r.channels || []).forEach((c) => (m[c] = (m[c] ?? 0) + 1)));
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [rows]);

  const budgetData = useMemo(() => {
    const counts = groupCount(rows, (r) => r.monthly_budget ?? "—");
    return BUDGET_ORDER.map((b) => ({ name: BUDGET_LABEL[b], value: counts.find((c) => c.name === b)?.value ?? 0 }));
  }, [rows]);

  const industryOpp = useMemo(() => {
    const m: Record<string, { sum: number; c: number }> = {};
    rows.forEach((r) => { const k = r.industry ?? "Other"; m[k] = m[k] || { sum: 0, c: 0 }; m[k].sum += r.pmf_score; m[k].c++; });
    return Object.entries(m).map(([name, v]) => ({ name, value: Math.round(v.sum / v.c) })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const funnelData = useMemo(() => {
    const aware = rows.length;
    const interested = rows.filter((r) => ["PilotNow", "InterestedProof", "Maybe"].includes(r.format_reaction ?? "")).length;
    const pilotReady = rows.filter((r) => !["Nothing"].includes(r.pilot_budget ?? "")).length;
    const meeting = rows.filter((r) => ["YesThisWeek", "YesNextMonth"].includes(r.followup_intent ?? "")).length;
    return [
      { name: "Responded", value: aware, fill: PALETTE[0] },
      { name: "Interested", value: interested, fill: PALETTE[1] },
      { name: "Pilot-ready", value: pilotReady, fill: PALETTE[2] },
      { name: "Meeting", value: meeting, fill: PALETTE[3] },
    ];
  }, [rows]);

  const radarData = useMemo(() => {
    const pains = ["ROI", "WrongAudience", "TooExpensive", "AdFatigue", "HyperLocal"];
    const label: Record<string, string> = { ROI: "ROI", WrongAudience: "Audience", TooExpensive: "Cost", AdFatigue: "Fatigue", HyperLocal: "Hyperlocal" };
    return pains.map((p) => ({ pain: label[p], value: rows.filter((r) => r.pain_point === p).length }));
  }, [rows]);

  const trendData = useMemo(() => {
    const m: Record<string, number> = {};
    rows.forEach((r) => { const d = (r.created_at || "").slice(0, 10); m[d] = (m[d] ?? 0) + 1; });
    return Object.entries(m).sort().map(([date, value]) => ({ date: date.slice(5), value }));
  }, [rows]);

  if (loading) return <div className="muted text-center py-20">Loading command centre…</div>;

  if (rows.length === 0)
    return (
      <div className="text-center py-20">
        <h1 className="font-head font-extrabold text-2xl mb-2">No responses yet</h1>
        <p className="muted">Share your survey link and responses will appear here in real time.</p>
      </div>
    );

  return (
    <div>
      {/* live alert banner */}
      <AnimatePresence>
        {alert && (
          <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] glass border border-accent/50 rounded-full px-5 py-3 flex items-center gap-3 shadow-glow">
            <span className="text-xl">🔥</span>
            <span className="text-sm">
              {alert.lead_tier === "enterprise" ? "Enterprise prospect" : "Hot lead"} just submitted —
              <b className="text-accent"> PMF {alert.pmf_score}</b> · {alert.industry} · {alert.city}
            </span>
            <button onClick={dismissAlert} className="muted hover:text-white ml-2">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="font-head font-extrabold text-3xl mb-1">Founder Command Centre</h1>
      <p className="muted mb-6">Live market demand, PMF, and opportunity — updating in real time.</p>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Kpi label="Total Responses" value={kpis.n} />
        <Kpi label="Avg PMF Score" value={kpis.avgPmf} accent />
        <Kpi label="Hot Leads" value={kpis.hot} color="#ff5533" />
        <Kpi label="Warm Leads" value={kpis.warm} color="#ffd166" />
        <Kpi label="High-Budget Brands" value={kpis.highBudget} color="#22d98b" />
        <Kpi label="Meeting Requests" value={kpis.meetings} color="#4dabf7" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Industry breakdown">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={industryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {industryData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip {...tip} />
            </PieChart>
          </ResponsiveContainer>
          <Legend data={industryData} />
        </Card>

        <Card title="Company size">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={sizeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {sizeData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip {...tip} />
            </PieChart>
          </ResponsiveContainer>
          <Legend data={sizeData} />
        </Card>

        <Card title="Budget distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={budgetData}>
              <XAxis dataKey="name" {...axis} /><YAxis {...axis} allowDecimals={false} />
              <Tooltip {...tip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#ff5533" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Industry opportunity (avg PMF)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={industryOpp} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" {...axis} /><YAxis type="category" dataKey="name" {...axis} width={80} />
              <Tooltip {...tip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {industryOpp.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Interest funnel">
          <ResponsiveContainer width="100%" height={260}>
            <FunnelChart>
              <Tooltip {...tip} />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
                <LabelList position="left" fill="#fff" stroke="none" dataKey="value" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Pain point analysis">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="pain" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} />
              <Radar dataKey="value" stroke="#ff5533" fill="#ff5533" fillOpacity={0.4} />
              <Tooltip {...tip} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Channel spend mix">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={channelData}>
              <XAxis dataKey="name" {...axis} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis {...axis} allowDecimals={false} />
              <Tooltip {...tip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#ff8c42" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Daily responses">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" {...axis} /><YAxis {...axis} allowDecimals={false} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey="value" stroke="#22d98b" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

const tip = {
  contentStyle: { background: "#1c1c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 13 },
  itemStyle: { color: "#fff" }, labelStyle: { color: "rgba(255,255,255,0.6)" },
};
const axis = { tick: { fill: "rgba(255,255,255,0.45)", fontSize: 12 }, axisLine: { stroke: "rgba(255,255,255,0.1)" }, tickLine: false };

function Kpi({ label, value, accent, color }: { label: string; value: number; accent?: boolean; color?: string }) {
  return (
    <div className="glass rounded-xl2 p-4">
      <div className="muted text-[11px] uppercase tracking-wider font-head mb-1">{label}</div>
      <div className="font-head font-extrabold text-3xl" style={{ color: color ?? (accent ? "#ff5533" : "#fff") }}>{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl2 p-5">
      <div className="font-head font-bold mb-4">{title}</div>
      {children}
    </div>
  );
}

function Legend({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
      {data.map((d, i) => (
        <span key={d.name} className="text-xs muted flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
          {d.name} ({d.value})
        </span>
      ))}
    </div>
  );
}
