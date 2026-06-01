"use client";
// ============================================================
//  SURVEY EXPERIENCE — Typeform x Linear x Stripe
//  One question at a time, keyboard shortcuts, live PMF meter.
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QUESTIONS, SurveyAnswers } from "@/types";
import { calcPmf, calcTier } from "@/lib/scoring";

const tierMeta: Record<string, { label: string; color: string }> = {
  cold: { label: "◯ Early Stage", color: "#8a8a99" },
  warm: { label: "⚡ Warm Lead", color: "#ffd166" },
  hot: { label: "🔥 Hot Lead", color: "#ff5533" },
  enterprise: { label: "★ Enterprise", color: "#22d98b" },
};

export default function SurveyClient() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ pmf: number; tier: string; high: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const q = QUESTIONS[step];
  const total = QUESTIONS.length;
  const livePmf = calcPmf(answers);
  const liveTier = calcTier(livePmf, answers);

  const answeredCurrent = (() => {
    const v = answers[q?.id as keyof SurveyAnswers];
    if (q?.type === "multi") return Array.isArray(v) && v.length > 0;
    return !!v;
  })();

  const selectSingle = (val: string) => {
    setAnswers((a) => ({ ...a, [q.id]: val }));
  };

  const toggleMulti = (val: string) => {
    setAnswers((a) => {
      const cur = (a[q.id as keyof SurveyAnswers] as string[]) || [];
      const has = cur.includes(val);
      if (!has && cur.length >= (q.max ?? 99)) return a;
      const next = has ? cur.filter((x) => x !== val) : [...cur, val];
      return { ...a, [q.id]: next };
    });
  };

  const next = useCallback(() => {
    if (!answeredCurrent) return;
    if (step < total - 1) setStep((s) => s + 1);
  }, [answeredCurrent, step, total]);

  const back = () => step > 0 && setStep((s) => s - 1);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(answers),
      });
      const json = await res.json();
      if (json.ok) {
        setResult({
          pmf: json.breakdown.pmf_score,
          tier: json.breakdown.lead_tier,
          high: json.breakdown.high_intent,
        });
        setDone(true);
      } else {
        alert("Something went wrong submitting. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- KEYBOARD SHORTCUTS ---------------------------------
  useEffect(() => {
    if (!started || done) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && answeredCurrent) {
        if (step === total - 1) submit();
        else next();
      }
      if (e.key === "Backspace" && (e.target as HTMLElement).tagName !== "INPUT") back();
      // letter keys select options
      const idx = "abcdefghijk".indexOf(e.key.toLowerCase());
      if (idx >= 0 && idx < q.options.length) {
        const opt = q.options[idx];
        q.type === "multi" ? toggleMulti(opt.val) : selectSingle(opt.val);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, done, step, answeredCurrent, q]);

  // ===================== HERO =====================
  if (!started) {
    return (
      <section className="min-h-[100svh] flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden">
        {/* full-screen cover image background */}
        <div className="absolute inset-0 pointer-events-none"
             style={{
               backgroundImage: "url('/cover.png')",
               backgroundSize: "cover",
               backgroundPosition: "center",
             }} />
        {/* dark overlay so text stays readable on top of the image */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: "rgba(10,10,14,0.62)" }} />
        <div className="absolute w-[700px] h-[700px] rounded-full -top-52 left-1/2 animate-pulseGlow pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(255,85,51,0.18) 0%, transparent 70%)" }} />
        <span className="relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-head font-bold tracking-widest uppercase text-accent2"
              style={{ background: "rgba(255,85,51,0.12)", border: "1px solid rgba(255,85,51,0.3)" }}>
          <span className="w-2 h-2 rounded-full bg-accent animate-blink" /> Nomadz · India
        </span>
        <h1 className="relative font-head font-extrabold leading-[1.05] tracking-tight mb-5 max-w-2xl"
            style={{ fontSize: "clamp(36px,7vw,68px)" }}>
          How does your brand{" "}
          <em className="not-italic bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
            reach the city?
          </em>
        </h1>
        <p className="relative text-[17px] text-white/70 max-w-md mx-auto mb-10 font-light">
          Quick research on how Indian brands approach advertising. Anonymous. No sales pitch. Under 3 minutes.
        </p>
        <div className="relative flex gap-2.5 flex-wrap justify-center mb-11">
          {["⏱ Under 3 min", "🔒 Anonymous", "📊 11 Questions", "🇮🇳 India Market"].map((p) => (
            <span key={p} className="bg-card/80 border border-white/10 rounded-full px-3.5 py-1.5 text-[13px] text-white/70">{p}</span>
          ))}
        </div>
        <button onClick={() => setStarted(true)}
          className="relative inline-flex items-center gap-2.5 bg-accent text-white font-head font-bold text-base rounded-full px-9 py-4 shadow-glow hover:shadow-glowLg hover:-translate-y-0.5 transition">
          Start the Survey <span>→</span>
        </button>
        <p className="relative text-white/50 text-xs mt-6">Tip: use your keyboard — letter keys to pick, Enter to continue.</p>
      </section>
    );
  }

  // ===================== THANK YOU =====================
  if (done && result) {
    const meta = tierMeta[result.tier];
    return (
      <section className="min-h-[100svh] flex flex-col items-center justify-center text-center px-6 max-w-xl mx-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-ok/15 text-ok flex items-center justify-center text-3xl mb-8">✓</motion.div>
        <ScoreRing score={result.pmf} />
        <span className="mt-6 px-4 py-1.5 rounded-full font-head font-bold text-sm"
              style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}55` }}>
          {meta.label}
        </span>
        {result.high && (
          <div className="mt-4 text-sm text-accent2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2">
            🔥 High-intent respondent · pilot budget above ₹10,000
          </div>
        )}
        <h2 className="font-head font-extrabold text-3xl mt-6 mb-3">
          {result.tier === "cold" ? "Thanks for your time." : "You're a strong fit."}
        </h2>
        <p className="muted max-w-md">
          {result.tier === "cold"
            ? "Your insights help us build the right product. We'll keep you in the loop with occasional updates — no spam."
            : "Based on your responses, you're among the ideal early adopters for this format. Expect a relevant follow-up shortly."}
        </p>
      </section>
    );
  }

  // ===================== SURVEY =====================
  const pct = Math.round((step / total) * 100);
  return (
    <section className="max-w-2xl mx-auto px-5 pb-24 min-h-[100svh]">
      {/* progress */}
      <div className="sticky top-0 z-50 bg-ink pt-4 pb-3 mb-8 border-b border-white/10">
        <div className="flex justify-between items-center mb-2.5">
          <span className="font-head text-xs font-bold tracking-widest uppercase muted">{q.section}</span>
          <span className="font-head text-[13px] font-bold text-accent">{pct}%</span>
        </div>
        <div className="h-1 bg-card rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
            animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }} />
        </div>
        {/* live PMF meter */}
        <div className="flex items-center gap-2 mt-3 justify-center">
          <span className="text-[11px] muted uppercase tracking-wider font-head">Live PMF</span>
          <div className="h-1.5 w-32 bg-card rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              animate={{ width: `${livePmf}%`, backgroundColor: tierMeta[liveTier].color }} />
          </div>
          <span className="text-[11px] font-head font-bold" style={{ color: tierMeta[liveTier].color }}>{livePmf}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.3 }}>
          <div className="font-head text-[13px] muted mb-2">Question {step + 1} of {total}</div>
          <h2 className="font-head font-bold text-2xl md:text-[28px] leading-snug mb-2">{q.text}</h2>
          {q.hint && <p className="muted text-sm mb-5">{q.hint}</p>}

          <div className="flex flex-col gap-2.5 mt-5">
            {q.options.map((o, i) => {
              const v = answers[q.id as keyof SurveyAnswers];
              const selected = q.type === "multi"
                ? Array.isArray(v) && v.includes(o.val)
                : v === o.val;
              return (
                <button key={o.val}
                  onClick={() => (q.type === "multi" ? toggleMulti(o.val) : selectSingle(o.val))}
                  className={`text-left flex items-start gap-3 rounded-xl2 px-4 py-3.5 border transition group ${
                    selected
                      ? "border-accent bg-accent/10"
                      : "border-white/10 bg-card hover:border-white/25"
                  }`}>
                  <span className={`font-head text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    selected ? "bg-accent text-white" : "bg-white/5 muted"
                  }`}>{"ABCDEFGHIJK"[i]}</span>
                  <span>
                    <span className="block">{o.label}</span>
                    {o.sub && <span className="block text-[13px] muted mt-0.5">{o.sub}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          {/* contact fields on last question */}
          {q.contact && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="font-head text-[11px] uppercase tracking-wider muted mb-3">Optional · Contact details</div>
              <input className="w-full bg-card border border-white/10 rounded-xl2 px-4 py-3 mb-2.5 outline-none focus:border-accent"
                placeholder="Your name"
                value={answers.contact_name ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, contact_name: e.target.value }))} />
              <input className="w-full bg-card border border-white/10 rounded-xl2 px-4 py-3 outline-none focus:border-accent"
                placeholder="Email or phone"
                value={answers.contact_info ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, contact_info: e.target.value }))} />
            </div>
          )}

          <div className="flex justify-between mt-7">
            {step > 0 ? (
              <button onClick={back} className="muted hover:text-white font-head text-sm">← Back</button>
            ) : <span />}
            {step === total - 1 ? (
              <button onClick={submit} disabled={!answeredCurrent || submitting}
                className="bg-accent disabled:opacity-30 text-white font-head font-bold rounded-full px-7 py-3 shadow-glow hover:shadow-glowLg transition">
                {submitting ? "Submitting…" : "Submit →"}
              </button>
            ) : (
              <button onClick={next} disabled={!answeredCurrent}
                className="bg-accent disabled:opacity-30 text-white font-head font-bold rounded-full px-7 py-3 transition">
                Continue →
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

// ----- animated score ring ----------------------------------
function ScoreRing({ score }: { score: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + 2, score);
      setN(cur);
      if (cur >= score) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [score]);
  const C = 314;
  const offset = C - (score / 100) * C;
  return (
    <div className="relative w-32 h-32">
      <svg width="128" height="128" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
        <motion.circle cx="60" cy="60" r="50" stroke="url(#g)" strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }} />
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff5533" /><stop offset="100%" stopColor="#ff8c42" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-head font-extrabold text-4xl">{n}</span>
        <span className="muted text-xs">/ 100 PMF</span>
      </div>
    </div>
  );
}
