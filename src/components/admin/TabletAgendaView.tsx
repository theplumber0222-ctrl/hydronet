"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ServiceType } from "@prisma/client";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { buildTabletFetchHeaders, STORAGE_ADMIN, STORAGE_WORKER } from "@/lib/tablet-client-headers";
import { getTodayYmdTennessee } from "@/lib/tennessee-day-bounds";
import { serviceTypeToLabelLocalized } from "@/lib/service-labels";

type DayBookingRow = {
  id: string;
  restaurantName: string;
  addressLine: string;
  scheduledAt: string;
  tabletCode: string | null;
  serviceType: ServiceType;
  status: string;
};

export function TabletAgendaView() {
  const { t, locale } = useI18n();
  const [workerId, setWorkerId] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [dateYmd, setDateYmd] = useState("");
  const [rows, setRows] = useState<DayBookingRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef(workerId);
  const adminRef = useRef(adminKey);
  const dateRef = useRef(dateYmd);
  workerRef.current = workerId;
  adminRef.current = adminKey;
  dateRef.current = dateYmd;

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(STORAGE_ADMIN);
      if (s) setAdminKey(s);
      const w = sessionStorage.getItem(STORAGE_WORKER);
      if (w) setWorkerId(w);
    } catch {
      /* ignore */
    }
    setDateYmd(getTodayYmdTennessee());
  }, []);

  const persistKey = useCallback(() => {
    const k = adminRef.current.trim();
    if (!k) return;
    try {
      sessionStorage.setItem(STORAGE_ADMIN, k);
    } catch {
      /* ignore */
    }
  }, []);

  const persistWorker = useCallback(() => {
    const w = workerRef.current.trim();
    if (!w) return;
    try {
      sessionStorage.setItem(STORAGE_WORKER, w);
    } catch {
      /* ignore */
    }
  }, []);

  const loadDay = useCallback(async () => {
    const d = dateRef.current.trim();
    if (!d) return;
    setLoading(true);
    setError(null);
    setRows(null);
    persistKey();
    persistWorker();
    try {
      const res = await fetch(
        `/api/admin/bookings/day?date=${encodeURIComponent(d)}`,
        {
          headers: buildTabletFetchHeaders(
            locale,
            workerRef.current,
            adminRef.current,
          ),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) setError(t("tabletCita.unauthorized"));
        else setError(t("tabletCita.networkError"));
        return;
      }
      setRows((data.bookings as DayBookingRow[]) ?? []);
    } catch {
      setError(t("tabletCita.networkError"));
    } finally {
      setLoading(false);
    }
  }, [locale, t, persistKey, persistWorker]);

  useEffect(() => {
    if (!dateYmd) return;
    void loadDay();
  }, [dateYmd, loadDay]);

  const timeLabel = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(
        locale === "es" ? "es-US" : "en-US",
        {
          timeZone: "America/Chicago",
          hour: "numeric",
          minute: "2-digit",
        },
      );
    } catch {
      return iso;
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-3 pb-24 pt-4">
      <div className="sticky top-0 z-20 -mx-3 mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-[#1F2937]/95 px-3 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/" className="text-sm text-sky-400 hover:underline">
            {t("tabletCita.navHome")}
          </Link>
          <span className="text-sm font-semibold text-sky-200">
            {t("tabletAgenda.navCurrent")}
          </span>
          <Link href="/admin/cita" className="text-sm text-sky-400 hover:underline">
            {t("tabletCita.navJobCard")}
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
          {t("tabletAgenda.pageTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {t("tabletAgenda.pageSubtitle")}
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
        <label className="label">{t("tabletAgenda.dateLabel")}</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="date"
            className="input-field max-w-xs"
            value={dateYmd}
            onChange={(e) => setDateYmd(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void loadDay()}
            disabled={loading || !dateYmd}
            className="btn-secondary min-h-[44px] shrink-0 px-4 disabled:opacity-50"
          >
            {loading ? "…" : t("tabletAgenda.refresh")}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">{t("tabletAgenda.dateHelp")}</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {rows && rows.length === 0 && !loading && (
        <p className="text-center text-sm text-slate-500">{t("tabletAgenda.emptyDay")}</p>
      )}

      {rows && rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((b) => (
            <li key={b.id}>
              <Link
                href={`/admin/cita?q=${encodeURIComponent(b.id)}`}
                className="block rounded-xl border border-slate-600 bg-slate-800/50 p-4 transition hover:border-sky-500/50 hover:bg-slate-800/80"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-lg font-semibold text-sky-300">
                    {timeLabel(b.scheduledAt)}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    {b.status}
                  </span>
                </div>
                <p className="mt-1 font-medium text-white">{b.restaurantName}</p>
                <p className="mt-0.5 text-sm text-slate-400">{b.addressLine}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {serviceTypeToLabelLocalized(
                    b.serviceType,
                    locale === "es" ? "es" : "en",
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
