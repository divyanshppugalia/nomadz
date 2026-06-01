"use client";
// ============================================================
//  useResponses — fetches all responses (admin) and subscribes
//  to realtime inserts. Powers live dashboard + hot-lead alerts.
// ============================================================
import { useEffect, useState, useRef } from "react";
import { browserClient } from "@/lib/supabase";
import { ResponseRow } from "@/types";

export function useResponses(pw: string) {
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<ResponseRow | null>(null);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/responses", { headers: { "x-admin-password": pw } });
      const json = await res.json();
      if (active && json.ok) {
        setRows(json.responses);
        json.responses.forEach((r: ResponseRow) => seen.current.add(r.id));
      }
      setLoading(false);
    })();

    // realtime — Part 10 alerts
    const sb = browserClient();
    const channel = sb
      .channel("responses-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "responses" }, (payload) => {
        const r = payload.new as ResponseRow;
        if (seen.current.has(r.id)) return;
        seen.current.add(r.id);
        setRows((prev) => [r, ...prev]);
        // fire alert for high-value leads
        if (r.pmf_score > 80 || r.lead_tier === "enterprise" || r.pilot_budget === "Over10k") {
          setAlert(r);
          setTimeout(() => setAlert(null), 8000);
        }
      })
      .subscribe();

    return () => {
      active = false;
      sb.removeChannel(channel);
    };
  }, [pw]);

  return { rows, loading, alert, dismissAlert: () => setAlert(null) };
}
