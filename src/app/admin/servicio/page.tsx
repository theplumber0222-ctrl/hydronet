import type { Metadata } from "next";
import { ServicioEnSitioForm } from "@/components/admin/ServicioEnSitioForm";

export const metadata: Metadata = {
  title: "On-site service | HydroNet",
  description:
    "Tablet inspection and billing report — HydroNet Plumbing (language selected in-app).",
  robots: { index: false, follow: false },
};

export default function AdminServicioPage() {
  return (
    <div className="min-h-screen bg-[#1F2937] pb-8">
      <ServicioEnSitioForm />
    </div>
  );
}
