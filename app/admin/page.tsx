"use client";
import AdminGate from "@/components/dashboard/AdminGate";
import DashShell from "@/components/dashboard/DashShell";
import Respondents from "@/components/dashboard/Respondents";

export default function Page() {
  return (
    <AdminGate>
      <DashShell>
        <Respondents />
      </DashShell>
    </AdminGate>
  );
}
