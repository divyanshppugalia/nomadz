"use client";
import AdminGate from "@/components/dashboard/AdminGate";
import DashShell from "@/components/dashboard/DashShell";
import Dashboard from "@/components/dashboard/Dashboard";

export default function Page() {
  return (
    <AdminGate>
      <DashShell>
        <Dashboard />
      </DashShell>
    </AdminGate>
  );
}
