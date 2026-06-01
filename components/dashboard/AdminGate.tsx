"use client";
// ============================================================
//  ADMIN GATE
//  Simple password gate. The password is sent as a header on
//  every admin API call; the server checks it against
//  ADMIN_PASSWORD. Not enterprise SSO, but real server-side
//  verification (no secrets shipped to the client bundle).
// ============================================================
import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext<{ pw: string; logout: () => void }>({ pw: "", logout: () => {} });
export const useAdmin = () => useContext(Ctx);

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [pw, setPw] = useState("");
  const [input, setInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("nomadz_admin_pw");
    if (saved) setPw(saved);
  }, []);

  const tryLogin = async () => {
    setChecking(true);
    setErr("");
    // verify by hitting a protected endpoint
    const res = await fetch("/api/responses", { headers: { "x-admin-password": input } });
    setChecking(false);
    if (res.status === 401) {
      setErr("Incorrect password.");
      return;
    }
    sessionStorage.setItem("nomadz_admin_pw", input);
    setPw(input);
  };

  const logout = () => {
    sessionStorage.removeItem("nomadz_admin_pw");
    setPw("");
    setInput("");
  };

  if (!pw) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center px-6">
        <div className="glass rounded-xl2 p-8 w-full max-w-sm text-center">
          <div className="font-head font-extrabold text-2xl mb-1">Nomadz Command Centre</div>
          <p className="muted text-sm mb-6">Admin access only</p>
          <input type="password" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            placeholder="Admin password"
            className="w-full bg-card border border-white/10 rounded-xl2 px-4 py-3 mb-3 outline-none focus:border-accent text-center" />
          {err && <p className="text-accent text-sm mb-3">{err}</p>}
          <button onClick={tryLogin} disabled={checking || !input}
            className="w-full bg-accent disabled:opacity-40 text-white font-head font-bold rounded-full py-3">
            {checking ? "Checking…" : "Enter"}
          </button>
        </div>
      </div>
    );
  }

  return <Ctx.Provider value={{ pw, logout }}>{children}</Ctx.Provider>;
}
