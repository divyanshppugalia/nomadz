"use client";
import AdminGate from "@/components/dashboard/AdminGate";
import DashShell from "@/components/dashboard/DashShell";
import Insights from "@/components/dashboard/Insights";

export default function Page() {
  return (
    <AdminGate>
      <DashShell>
        <Insights />
      </DashShell>
    </AdminGate>
  );
}
