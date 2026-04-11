import { redirect } from "next/navigation";

/** Compatibilidad: las sesiones de Checkout ahora redirigen a `/success`. */
export default async function BookSuccessRedirect({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const p = await searchParams;
  const qs = p.session_id
    ? `?session_id=${encodeURIComponent(p.session_id)}`
    : "";
  redirect(`/success${qs}`);
}
