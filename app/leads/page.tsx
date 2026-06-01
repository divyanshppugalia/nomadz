"use client";
import AdminGate from "@/components/dashboard/AdminGate";
import DashShell from "@/components/dashboard/DashShell";
import Leads from "@/components/dashboard/Leads";

export default function Page() {
  return (
    <AdminGate>
      <DashShell>
        <Leads />
      </DashShell>
    </AdminGate>
  );
}
