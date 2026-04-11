import type { Metadata } from "next";
import { HistorialClienteView } from "@/components/admin/HistorialClienteView";

export const metadata: Metadata = {
  title: "Client history | HydroNet",
  description: "Bookings, estimates, and work orders by email.",
  robots: { index: false, follow: false },
};

export default function AdminHistorialPage() {
  return (
    <div className="min-h-screen bg-[#1F2937] pb-8">
      <HistorialClienteView />
    </div>
  );
}
