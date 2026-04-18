"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { GoldMembershipJoinForm } from "@/components/GoldMembershipJoinForm";
import { JoinGoldAuthGate } from "@/components/JoinGoldAuthGate";

type Billing = "annual" | "monthly";

/**
 * Cuando el servidor no ve cookie de sesión (caché RSC, timing tras login), el cliente
 * sí puede tener sesión vía NextAuth — aquí resolvemos gate vs formulario sin depender solo de auth().
 */
export function JoinGoldSessionFallback({ billing }: { billing: Billing }) {
  const { t } = useI18n();
  const router = useRouter();
  const { status } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/membership/summary", {
          credentials: "same-origin",
        });
        const data = (await res.json()) as {
          gold?: { active?: boolean } | null;
        };
        if (cancelled) return;
        if (data.gold?.active === true) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        if (cancelled) return;
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="mt-10 flex justify-center py-16">
        <p className="text-slate-400">{t("book.loading")}</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <JoinGoldAuthGate billing={billing} />;
  }

  if (!ready) {
    return (
      <div className="mt-10 flex justify-center py-16">
        <p className="text-slate-400">{t("book.loading")}</p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <GoldMembershipJoinForm defaultBilling={billing} />
    </div>
  );
}
