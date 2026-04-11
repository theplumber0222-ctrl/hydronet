import type { Metadata } from "next";
import { EstimadosTabletView } from "@/components/admin/EstimadosTabletView";

export const metadata: Metadata = {
  title: "Estimates | HydroNet",
  description: "Create and convert estimates — HydroNet Plumbing.",
  robots: { index: false, follow: false },
};

export default function AdminEstimadosPage() {
  return (
    <div className="min-h-screen bg-[#1F2937] pb-8">
      <EstimadosTabletView />
    </div>
  );
}
