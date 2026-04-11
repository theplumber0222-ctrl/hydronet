import { CheckoutSuccessPage } from "@/components/CheckoutSuccessPage";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; gold_included?: string }>;
}) {
  const p = await searchParams;
  return (
    <CheckoutSuccessPage
      sessionId={p.session_id}
      goldIncluded={p.gold_included === "1"}
    />
  );
}
