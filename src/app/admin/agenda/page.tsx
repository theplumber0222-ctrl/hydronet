import type { Metadata } from "next";
import { Suspense } from "react";
import { TabletAgendaView } from "@/components/admin/TabletAgendaView";

export const metadata: Metadata = {
  title: "Schedule · tablet | HydroNet",
  description:
    "Day schedule for HydroNet Plumbing field staff (Tennessee calendar day).",
  robots: { index: false, follow: false },
};

function AgendaFallback() {
  return (
    <div className="mx-auto max-w-2xl px-3 py-10 text-slate-400">…</div>
  );
}

export default function AdminAgendaPage() {
  return (
    <div className="min-h-screen bg-[#1F2937] pb-8">
      <Suspense fallback={<AgendaFallback />}>
        <TabletAgendaView />
      </Suspense>
    </div>
  );
}
