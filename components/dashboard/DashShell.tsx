"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "./AdminGate";

const NAV = [
  { href: "/dashboard", label: "Command Centre" },
  { href: "/insights", label: "Insights" },
  { href: "/leads", label: "Lead Scoring" },
  { href: "/map", label: "UK Map" },
  { href: "/admin", label: "Respondents" },
];

export default function DashShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { logout } = useAdmin();
  return (
    <div className="min-h-[100svh]">
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center gap-6">
          <Link href="/dashboard" className="font-head font-extrabold text-lg whitespace-nowrap">
            Nomadz <span className="text-accent">·</span> <span className="muted font-normal text-sm">UK Intelligence</span>
          </Link>
          <nav className="flex gap-1 overflow-x-auto flex-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap font-head ${
                  path === n.href ? "bg-accent text-white" : "muted hover:text-white"
                }`}>{n.label}</Link>
            ))}
          </nav>
          <button onClick={logout} className="muted hover:text-white text-sm font-head whitespace-nowrap">Log out</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-5 py-8">{children}</main>
    </div>
  );
}
