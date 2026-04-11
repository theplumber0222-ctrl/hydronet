import type { Metadata } from "next";
import { Suspense } from "react";
import { TabletCitaView } from "@/components/admin/TabletCitaView";

export const metadata: Metadata = {
  title: "Job card · tablet | HydroNet",
  description:
    "Read-only job card and client verification for HydroNet Plumbing field staff.",
  robots: { index: false, follow: false },
};

function TabletFallback() {
  return (
    <div className="mx-auto max-w-2xl px-3 py-10 text-slate-400">…</div>
  );
}

export default function AdminCitaPage() {
  return (
    <div className="min-h-screen bg-[#1F2937] pb-8">
      <Suspense fallback={<TabletFallback />}>
        <TabletCitaView />
      </Suspense>
    </div>
  );
}
