"use client";
import AdminGate from "@/components/dashboard/AdminGate";
import DashShell from "@/components/dashboard/DashShell";
import UKMap from "@/components/dashboard/UKMap";

export default function Page() {
  return (
    <AdminGate>
      <DashShell>
        <UKMap />
      </DashShell>
    </AdminGate>
  );
}
