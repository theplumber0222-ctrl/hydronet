"use client";

import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";

type Props = {
  hasActiveSubscription: boolean;
  underCommitment: boolean;
};

export function CancelMembershipSection({
  hasActiveSubscription,
  underCommitment,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasActiveSubscription) return null;

  async function confirmCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/membership/cancel", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : t("cancelMembership.errGeneric"),
        );
        return;
      }
      setOpen(false);
      window.location.reload();
    } catch {
      setError(t("cancelMembership.errNetwork"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-amber-900/60 bg-amber-950/20 p-6">
      <h2 className="text-lg font-semibold text-amber-200/90">
        {t("cancelMembership.title")}
      </h2>
      <p className="mt-2 text-sm text-slate-400">{t("cancelMembership.subtitle")}</p>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="mt-4 rounded-lg border border-amber-700/80 bg-amber-950/40 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-950/60"
      >
        {t("cancelMembership.request")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 p-6 shadow-xl">
            {underCommitment ? (
              <>
                <h3 className="text-base font-semibold text-amber-200">
                  {t("cancelMembership.commitmentTitle")}
                </h3>
                <div className="mt-4 text-sm leading-relaxed text-slate-300">
                  <p>{t("stripeUi.cancelAlert")}</p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-slate-100">
                  {t("cancelMembership.confirmTitle")}
                </h3>
                <p className="mt-3 text-sm text-slate-400">
                  {t("cancelMembership.confirmBody")}
                </p>
              </>
            )}

            {error && (
              <p className="mt-4 rounded-md bg-red-950/60 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                {t("cancelMembership.back")}
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={loading}
                className="rounded-lg bg-red-900/80 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-800 disabled:opacity-50"
              >
                {loading
                  ? t("cancelMembership.processing")
                  : t("cancelMembership.confirmBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
