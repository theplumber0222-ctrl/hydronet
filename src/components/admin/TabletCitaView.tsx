"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ServiceType } from "@prisma/client";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { serviceTypeToLabelLocalized } from "@/lib/service-labels";

const STORAGE_ADMIN = "hydronet_servicio_admin_key";
const STORAGE_WORKER = "hydronet_worker_id";

type BookingPayload = {
  id: string;
  restaurantName: string;
  addressLine: string;
  placeId: string | null;
  phone: string;
  email: string;
  serviceType: ServiceType;
  scheduledAt: string;
  status: string;
  workDescription: string | null;
  billingContactName: string | null;
  invoiceEmail: string | null;
  siteContactName: string | null;
  siteContactPhone: string | null;
  spendLimitCents: number | null;
  approvalOverLimitNote: string | null;
  tabletCode: string | null;
};

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}) {
  const v = value?.trim();
  if (!v) {
    return (
      <div className="rounded-lg border border-slate-700/80 bg-slate-900/30 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-sm text-slate-500">—</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-900/30 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {multiline ? (
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
          {v}
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-100">{v}</p>
      )}
    </div>
  );
}

export function TabletCitaView() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const [workerId, setWorkerId] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [bookingIdInput, setBookingIdInput] = useState("");
  const [booking, setBooking] = useState<BookingPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastAutoFetchedQ = useRef<string>("");

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(STORAGE_ADMIN);
      if (s) setAdminKey(s);
      const w = sessionStorage.getItem(STORAGE_WORKER);
      if (w) setWorkerId(w);
    } catch {
      /* ignore */
    }
  }, []);

  const persistKey = useCallback(() => {
    const k = adminKey.trim();
    if (!k) return;
    try {
      sessionStorage.setItem(STORAGE_ADMIN, k);
    } catch {
      /* ignore */
    }
  }, [adminKey]);

  const persistWorker = useCallback(() => {
    const w = workerId.trim();
    if (!w) return;
    try {
      sessionStorage.setItem(STORAGE_WORKER, w);
    } catch {
      /* ignore */
    }
  }, [workerId]);

  const fetchBooking = useCallback(
    async (rawQ: string) => {
      const q = rawQ.trim();
      if (!q) return;
      setLoading(true);
      setError(null);
      setBooking(null);
      persistKey();
      persistWorker();
      try {
        const headers: HeadersInit = {
          "x-hydronet-lang": locale,
        };
        let w = workerId.trim();
        if (!w) {
          try {
            w = sessionStorage.getItem(STORAGE_WORKER) ?? "";
          } catch {
            w = "";
          }
        }
        if (w) headers["x-hydronet-worker-id"] = w;

        let key = adminKey.trim();
        if (!key) {
          try {
            key = sessionStorage.getItem(STORAGE_ADMIN) ?? "";
          } catch {
            key = "";
          }
        }
        if (key) headers["x-hydronet-admin-key"] = key;

        const res = await fetch(
          `/api/admin/booking/lookup?q=${encodeURIComponent(q)}`,
          { headers },
        );
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) setError(t("tabletCita.notFound"));
          else if (res.status === 401) setError(t("tabletCita.unauthorized"));
          else setError(t("tabletCita.networkError"));
          return;
        }
        if (data?.booking) {
          setBooking(data.booking as BookingPayload);
        }
      } catch {
        setError(t("tabletCita.networkError"));
      } finally {
        setLoading(false);
      }
    },
    [adminKey, locale, persistKey, persistWorker, workerId, t],
  );

  const urlWorker = searchParams.get("worker")?.trim() ?? "";
  useEffect(() => {
    if (urlWorker) setWorkerId(urlWorker);
  }, [urlWorker]);

  const urlQ =
    searchParams.get("q")?.trim() ??
    searchParams.get("id")?.trim() ??
    "";
  useEffect(() => {
    if (!urlQ) {
      lastAutoFetchedQ.current = "";
      return;
    }
    if (lastAutoFetchedQ.current === urlQ) return;
    lastAutoFetchedQ.current = urlQ;
    setBookingIdInput(urlQ);
    void fetchBooking(urlQ);
  }, [urlQ, fetchBooking]);

  const scheduledLabel = useMemo(() => {
    if (!booking) return "";
    try {
      return new Date(booking.scheduledAt).toLocaleString(
        locale === "es" ? "es-US" : "en-US",
        {
          timeZone: "America/Chicago",
          dateStyle: "full",
          timeStyle: "short",
        },
      );
    } catch {
      return booking.scheduledAt;
    }
  }, [booking, locale]);

  const spendUsd =
    booking?.spendLimitCents != null && booking.spendLimitCents > 0
      ? (booking.spendLimitCents / 100).toFixed(2)
      : null;

  const hasVerification = Boolean(
    booking &&
      (booking.workDescription?.trim() ||
        booking.billingContactName?.trim() ||
        booking.invoiceEmail?.trim() ||
        booking.siteContactName?.trim() ||
        booking.siteContactPhone?.trim() ||
        (booking.spendLimitCents != null && booking.spendLimitCents > 0) ||
        booking.approvalOverLimitNote?.trim()),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-3 pb-24 pt-4">
      <div className="sticky top-0 z-20 -mx-3 mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-[#1F2937]/95 px-3 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/" className="text-sm text-sky-400 hover:underline">
            {t("tabletCita.navHome")}
          </Link>
          <Link href="/admin/servicio" className="text-sm text-sky-400 hover:underline">
            {t("tabletCita.navServicio")}
          </Link>
          <Link href="/admin/estimados" className="text-sm text-sky-400 hover:underline">
            {t("tabletCita.navEstimates")}
          </Link>
          <Link href="/admin/historial" className="text-sm text-sky-400 hover:underline">
            {t("tabletCita.navHistory")}
          </Link>
        </div>
        <LanguageSwitcher />
      </div>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400/90">
          {t("tabletCita.metaNote")}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {t("tabletCita.pageTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {t("tabletCita.pageSubtitle")}
        </p>
      </header>

      <div className="rounded-xl border border-slate-600 bg-slate-800/40 p-4">
        <label className="label">{t("tabletCita.workerIdLabel")}</label>
        <input
          className="input-field mt-1 font-mono text-sm"
          autoComplete="off"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          onBlur={persistWorker}
          placeholder="HN-001"
        />
        <p className="mt-1 text-xs text-slate-500">{t("tabletCita.workerIdHelp")}</p>
      </div>

      <div className="rounded-xl border border-slate-600 bg-slate-800/40 p-4">
        <label className="label">{t("tabletCita.adminKeyLabel")}</label>
        <input
          className="input-field mt-1"
          type="password"
          autoComplete="off"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          onBlur={persistKey}
        />
        <p className="mt-1 text-xs text-slate-500">{t("tabletCita.adminKeyHelp")}</p>
      </div>

      <div className="rounded-xl border border-slate-600 bg-slate-800/40 p-4">
        <label className="label">{t("tabletCita.codeOrIdLabel")}</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className="input-field mt-0 flex-1 font-mono text-sm"
            value={bookingIdInput}
            onChange={(e) => setBookingIdInput(e.target.value)}
            placeholder="AB12CD34 o cuid…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => void fetchBooking(bookingIdInput)}
            disabled={loading || !bookingIdInput.trim()}
            className="btn-primary min-h-[48px] shrink-0 px-5 disabled:opacity-50"
          >
            {loading ? "…" : t("tabletCita.loadButton")}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">{t("tabletCita.codeOrIdHelp")}</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {booking && (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-400/90">
              {t("tabletCita.sectionBasics")}
            </h2>
            <div className="mt-3 space-y-3">
              <Field label={t("tabletCita.bookingReference")} value={booking.id} />
              {booking.tabletCode ? (
                <Field
                  label={t("tabletCita.tabletCodeLabel")}
                  value={booking.tabletCode}
                />
              ) : null}
              <Field
                label={t("booking.businessName")}
                value={booking.restaurantName}
              />
              <Field label={t("tabletCita.address")} value={booking.addressLine} />
              <Field label={t("tabletCita.scheduledAt")} value={scheduledLabel} />
              <Field
                label={t("tabletCita.serviceType")}
                value={serviceTypeToLabelLocalized(
                  booking.serviceType,
                  locale === "es" ? "es" : "en",
                )}
              />
              <Field label={t("tabletCita.status")} value={booking.status} />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t("tabletCita.mainContact")}
              </p>
              <Field label={t("tabletCita.phoneMain")} value={booking.phone} />
              <Field label={t("tabletCita.emailMain")} value={booking.email} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-400/90">
              {t("tabletCita.sectionVerify")}
            </h2>
            {!hasVerification ? (
              <p className="mt-3 text-sm text-slate-500">{t("tabletCita.noVerification")}</p>
            ) : (
              <div className="mt-3 space-y-3">
                <Field
                  label={t("verify.workDescription")}
                  value={booking.workDescription}
                  multiline
                />
                <Field
                  label={t("verify.billingContactName")}
                  value={booking.billingContactName}
                />
                <Field
                  label={t("verify.invoiceEmail")}
                  value={booking.invoiceEmail}
                />
                <Field
                  label={t("verify.siteContactName")}
                  value={booking.siteContactName}
                />
                <Field
                  label={t("verify.siteContactPhone")}
                  value={booking.siteContactPhone}
                />
                {spendUsd != null && (
                  <Field
                    label={t("verify.spendLimitLabel")}
                    value={`$${spendUsd}`}
                  />
                )}
                <Field
                  label={t("verify.approvalOverLimitLabel")}
                  value={booking.approvalOverLimitNote}
                  multiline
                />
              </div>
            )}
          </section>

          <Link
            href="/admin/servicio"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-sky-600/50 bg-sky-500/10 px-4 text-center text-sm font-semibold text-sky-200 hover:bg-sky-500/20"
          >
            {t("tabletCita.linkServicio")}
          </Link>
          <button
            type="button"
            onClick={() =>
              void fetchBooking(booking.tabletCode ?? booking.id)
            }
            className="w-full rounded-xl border border-slate-600 py-3 text-sm font-medium text-slate-300 hover:border-slate-500"
          >
            {t("tabletCita.refresh")}
          </button>
        </div>
      )}
    </div>
  );
}
