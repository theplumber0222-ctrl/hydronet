import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { getPublicContactEmail } from "@/lib/legal-business-info";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";

type Props = {
  sessionId?: string;
  /** Visita preventiva incluida Gold confirmada sin Checkout (sin cargo). */
  goldIncluded?: boolean;
};

/** Página de confirmación tras Stripe Checkout (ruta canónica `/success`). */
export async function CheckoutSuccessPage({
  sessionId,
  goldIncluded,
}: Props) {
  const d = getDictionary(await getLocale());
  const email = getPublicContactEmail();

  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col justify-center px-4 py-16 text-center">
      <BrandLogo
        variant="success"
        alt={t(d, "meta.siteLogoAlt")}
        className="mb-8"
      />
      <h1 className="text-2xl font-bold text-white">{t(d, "success.title")}</h1>
      {goldIncluded && (
        <p className="mt-4 rounded-lg border border-orange-500/30 bg-orange-950/25 px-4 py-3 text-sm text-orange-100/95">
          {t(d, "success.goldIncludedNote")}
        </p>
      )}
      <p className="mt-4 text-slate-300">
        {t(d, "success.body1")}{" "}
        <span className="text-sky-400">{email}</span> {t(d, "success.body1b")}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {goldIncluded
          ? t(d, "success.body2GoldIncluded")
          : t(d, "success.body2")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/dashboard" className="btn-secondary">
          {t(d, "success.dashboard")}
        </Link>
        <Link href="/book" className="link-sky self-center text-sm">
          {t(d, "success.newBooking")}
        </Link>
        <Link href="/" className="link-sky self-center text-sm">
          {t(d, "success.backHome")}
        </Link>
      </div>
      <p className="mt-8 text-center text-xs text-slate-500">
        <Link href="/terms" className="link-sky">
          {t(d, "success.terms")}
        </Link>
        {" · "}
        <Link href="/refunds" className="link-sky">
          {t(d, "success.refunds")}
        </Link>
        {" · "}
        <Link href="/privacy" className="link-sky">
          {t(d, "success.privacy")}
        </Link>
      </p>
      {sessionId && (
        <p className="mt-8 break-all text-xs text-slate-600">
          {t(d, "success.refLabel")} {sessionId}
        </p>
      )}
    </main>
  );
}
