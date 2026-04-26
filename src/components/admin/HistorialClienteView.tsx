"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { ServiceType } from "@prisma/client";
import { serviceTypeToLabelLocalized } from "@/lib/service-labels";

const STORAGE_ADMIN = "hydronet_servicio_admin_key";
const STORAGE_WORKER = "hydronet_worker_id";

type BookingH = {
  id: string;
  restaurantName: string;
  email: string;
  phone: string;
  scheduledAt: string;
  status: string;
  serviceType: string;
  createdAt: string;
};

type EstimateH = {
  id: string;
  restaurantName: string;
  email: string;
  totalCents: number;
  status: string;
  expiresAt: string;
  convertedAt: string | null;
  createdAt: string;
};

type WorkOrderH = {
  id: string;
  estimateId: string;
  restaurantName: string;
  email: string;
  totalCents: number;
  status: string;
  workerId: string | null;
  authorizedAt: string;
  createdAt: string;
};

type StoredPhotoRefH = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  /** Ruta API firmada (Blob privado); preferir sobre `url` en UI. */
  viewUrl?: string;
};

type ServicioReportH = {
  id: string;
  clientEmail: string;
  restaurantName: string;
  technicianName: string;
  serviceDate: string;
  serviceLanguage: string;
  bookingReference: string | null;
  checklistAirGap: string;
  checklistHandSink: string;
  checklistGreaseTrap: string;
  amountDue: number;
  invoiceSubtotal: number;
  depositCredit: number;
  pdfUrl: string | null;
  photosBefore: StoredPhotoRefH[];
  photosAfter: StoredPhotoRefH[];
  createdAt: string;
};

type TimelineItem =
  | { kind: "booking"; at: string; data: BookingH }
  | { kind: "estimate"; at: string; data: EstimateH }
  | { kind: "workOrder"; at: string; data: WorkOrderH }
  | { kind: "servicioReport"; at: string; data: ServicioReportH };

export function HistorialClienteView() {
  const { t, locale } = useI18n();
  const [workerId, setWorkerId] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingH[]>([]);
  const [estimates, setEstimates] = useState<EstimateH[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderH[]>([]);
  const [servicioReports, setServicioReports] = useState<ServicioReportH[]>([]);
  const [loadedEmail, setLoadedEmail] = useState<string | null>(null);

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

  /** Si el usuario edita el correo respecto al último carga, no mostrar el listado viejo. */
  const onEmailInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setEmailInput(v);
      const t = v.trim();
      if (!loadedEmail) return;
      if (
        !t ||
        t.toLowerCase() !== loadedEmail.toLowerCase()
      ) {
        setBookings([]);
        setEstimates([]);
        setWorkOrders([]);
        setServicioReports([]);
        setLoadedEmail(null);
        setError(null);
      }
    },
    [loadedEmail],
  );

  const buildHeaders = useCallback((): HeadersInit => {
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
    return headers;
  }, [adminKey, locale, workerId]);

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

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [];
    for (const b of bookings) {
      items.push({ kind: "booking", at: b.createdAt, data: b });
    }
    for (const e of estimates) {
      items.push({ kind: "estimate", at: e.createdAt, data: e });
    }
    for (const w of workOrders) {
      items.push({ kind: "workOrder", at: w.authorizedAt, data: w });
    }
    for (const s of servicioReports) {
      items.push({ kind: "servicioReport", at: s.serviceDate, data: s });
    }
    items.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
    return items;
  }, [bookings, estimates, workOrders, servicioReports]);

  async function onLoad() {
    const q = emailInput.trim();
    if (!q.includes("@")) {
      setError(t("adminHistorial.errEmail"));
      return;
    }
    setLoading(true);
    setError(null);
    persistKey();
    persistWorker();
    try {
      const res = await fetch(
        `/api/admin/customer-history?email=${encodeURIComponent(q)}`,
        { headers: buildHeaders() },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 401
            ? t("tabletCita.unauthorized")
            : t("tabletCita.networkError"),
        );
        return;
      }
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      setEstimates(Array.isArray(data.estimates) ? data.estimates : []);
      setWorkOrders(Array.isArray(data.workOrders) ? data.workOrders : []);
      setServicioReports(
        Array.isArray(data.servicioReports) ? data.servicioReports : [],
      );
      setLoadedEmail(typeof data.email === "string" ? data.email : q);
    } catch {
      setError(t("tabletCita.networkError"));
    } finally {
      setLoading(false);
    }
  }

  const localeTag = locale === "es" ? "es-US" : "en-US";
  const lang = locale === "es" ? "es" : "en";

  function fmt(iso: string) {
    try {
      return new Date(iso).toLocaleString(localeTag, {
        timeZone: "America/Chicago",
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  function usd(cents: number) {
    return (cents / 100).toFixed(2);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-3 pb-24 pt-4">
      <div className="sticky top-0 z-20 -mx-3 mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-[#1F2937]/95 px-3 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/" className="text-sm text-sky-400 hover:underline">
            {t("tabletCita.navHome")}
          </Link>
          <Link href="/admin/cita" className="text-sm text-sky-400 hover:underline">
            {t("tabletCita.navJobCard")}
          </Link>
          <Link
            href="/admin/servicio"
            className="text-sm text-sky-400 hover:underline"
          >
            {t("tabletCita.navServicio")}
          </Link>
          <Link
            href="/admin/estimados"
            className="text-sm text-sky-400 hover:underline"
          >
            {t("tabletCita.navEstimates")}
          </Link>
        </div>
        <LanguageSwitcher />
      </div>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400/90">
          {t("tabletCita.metaNote")}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {t("adminHistorial.pageTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {t("adminHistorial.pageSubtitle")}
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
        <label className="label">{t("adminHistorial.emailLabel")}</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className="input-field mt-0 flex-1"
            type="email"
            value={emailInput}
            onChange={onEmailInputChange}
            placeholder="cliente@restaurant.com"
          />
          <button
            type="button"
            onClick={() => void onLoad()}
            disabled={loading || !emailInput.trim()}
            className="btn-primary min-h-[48px] shrink-0 px-5 disabled:opacity-50"
          >
            {loading ? "…" : t("adminHistorial.loadButton")}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {!loadedEmail && !loading && (
        <p className="text-sm text-slate-500">{t("adminHistorial.emptyBeforeSearch")}</p>
      )}

      {loadedEmail && (
        <section className="space-y-4">
          <p className="text-sm text-slate-400">
            <span className="text-slate-500">{t("adminHistorial.resultsFor")}</span>{" "}
            <span className="font-mono text-sky-200">{loadedEmail}</span>
          </p>

          {timeline.length === 0 ? (
            <p className="text-sm text-slate-500">{t("adminHistorial.noRows")}</p>
          ) : (
            <ol className="space-y-3 border-l border-slate-600 pl-4">
              {timeline.map((item, idx) => {
                if (item.kind === "booking") {
                  const b = item.data;
                  return (
                    <li key={`b-${b.id}-${idx}`} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500" />
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t("adminHistorial.kindBooking")} · {fmt(item.at)}
                      </p>
                      <p className="mt-1 font-medium text-slate-100">
                        {b.restaurantName}
                      </p>
                      <p className="text-xs text-slate-500">{b.id}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {serviceTypeToLabelLocalized(
                          b.serviceType as ServiceType,
                          lang,
                        )}{" "}
                        · {b.status}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t("adminHistorial.scheduledAt")}: {fmt(b.scheduledAt)}
                      </p>
                    </li>
                  );
                }
                if (item.kind === "estimate") {
                  const e = item.data;
                  return (
                    <li key={`e-${e.id}-${idx}`} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t("adminHistorial.kindEstimate")} · {fmt(item.at)}
                      </p>
                      <p className="mt-1 font-medium text-slate-100">
                        {e.restaurantName}
                      </p>
                      <p className="text-xs text-slate-500">{e.id}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        ${usd(e.totalCents)} · {e.status}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t("adminHistorial.expiresAt")}: {fmt(e.expiresAt)}
                      </p>
                    </li>
                  );
                }
                if (item.kind === "workOrder") {
                  const w = item.data;
                  return (
                    <li key={`w-${w.id}-${idx}`} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t("adminHistorial.kindWorkOrder")} · {fmt(item.at)}
                      </p>
                      <p className="mt-1 font-medium text-slate-100">
                        {w.restaurantName}
                      </p>
                      <p className="text-xs text-slate-500">{w.id}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        ${usd(w.totalCents)} · {w.status}
                        {w.workerId ? ` · ${w.workerId}` : ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t("adminHistorial.estimateRef")}: {w.estimateId}
                      </p>
                    </li>
                  );
                }
                const s = item.data;
                return (
                  <li key={`s-${s.id}-${idx}`} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-fuchsia-500" />
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t("adminHistorial.kindServicioReport")} · {fmt(item.at)}
                    </p>
                    <p className="mt-1 font-medium text-slate-100">
                      {s.restaurantName}
                    </p>
                    <p className="text-xs text-slate-500">{s.id}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {t("adminHistorial.technician")}: {s.technicianName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t("adminHistorial.serviceDate")}: {fmt(s.serviceDate)}
                    </p>
                    {s.bookingReference && (
                      <p className="text-xs text-slate-500">
                        {t("adminHistorial.bookingRefShort")}: {s.bookingReference}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-slate-300">
                      {t("adminHistorial.amountDue")}: ${s.amountDue.toFixed(2)}
                    </p>
                    <ChecklistRow t={t} report={s} />
                    <PhotoStrip
                      t={t}
                      title={t("adminHistorial.photosBefore")}
                      photos={s.photosBefore}
                      noPhotosLabel={t("adminHistorial.noPhotos")}
                    />
                    <PhotoStrip
                      t={t}
                      title={t("adminHistorial.photosAfter")}
                      photos={s.photosAfter}
                      noPhotosLabel={t("adminHistorial.noPhotos")}
                    />
                    {s.pdfUrl && (
                      <a
                        href={s.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-sky-500/50 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-500/20"
                      >
                        {t("adminHistorial.downloadPdf")}
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}

function ChecklistRow({
  t,
  report,
}: {
  t: (path: string) => string;
  report: ServicioReportH;
}) {
  const items: Array<{ key: string; label: string; status: string }> = [
    {
      key: "ag",
      label: t("adminHistorial.chkAirGap"),
      status: report.checklistAirGap,
    },
    {
      key: "hs",
      label: t("adminHistorial.chkHandSink"),
      status: report.checklistHandSink,
    },
    {
      key: "gt",
      label: t("adminHistorial.chkGreaseTrap"),
      status: report.checklistGreaseTrap,
    },
  ];
  function statusWord(s: string) {
    if (s === "pass") return t("adminHistorial.chkPass");
    if (s === "fail") return t("adminHistorial.chkFail");
    return t("adminHistorial.chkNa");
  }
  function statusClass(s: string) {
    if (s === "pass")
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    if (s === "fail")
      return "border-red-500/40 bg-red-500/10 text-red-200";
    return "border-slate-600 bg-slate-700/30 text-slate-300";
  }
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span
          key={it.key}
          className={`rounded-md border px-2 py-0.5 text-[11px] ${statusClass(it.status)}`}
        >
          {it.label}: {statusWord(it.status)}
        </span>
      ))}
    </div>
  );
}

function PhotoStrip({
  t,
  title,
  photos,
  noPhotosLabel,
}: {
  t: (path: string) => string;
  title: string;
  photos: StoredPhotoRefH[];
  noPhotosLabel: string;
}) {
  const [viewer, setViewer] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  useEffect(() => {
    if (!viewer) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewer(null);
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [viewer]);

  return (
    <div className="mt-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title} ({photos.length})
      </p>
      {photos.length === 0 ? (
        <p className="mt-1 text-xs text-slate-500">{noPhotosLabel}</p>
      ) : (
        <div className="mt-1 flex flex-wrap gap-2">
          {photos.map((p) => (
            <HistorialPhotoThumb
              key={p.pathname}
              p={p}
              t={t}
              onOpen={(src) => setViewer({ src, alt: title })}
            />
          ))}
        </div>
      )}

      {viewer ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setViewer(null)}
        >
          <div
            className="flex max-h-full w-full max-w-4xl flex-col items-stretch"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex w-full shrink-0 items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    viewer.src,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                className="rounded-md border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                {t("adminHistorial.openPhotoInNewTab")}
              </button>
              <button
                type="button"
                onClick={() => setViewer(null)}
                className="rounded-md border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                {t("adminHistorial.closePhotoViewer")}
              </button>
            </div>
            <div className="min-h-0 flex flex-1 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewer.src}
                alt={viewer.alt}
                className="max-h-[min(80vh,900px)] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HistorialPhotoThumb({
  p,
  t,
  onOpen,
}: {
  p: StoredPhotoRefH;
  t: (path: string) => string;
  onOpen: (src: string) => void;
}) {
  const [broken, setBroken] = useState(false);
  const src = p.viewUrl ?? p.url;
  return (
    <button
      type="button"
      onClick={() => onOpen(src)}
      className="block h-16 w-16 cursor-zoom-in overflow-hidden rounded-md border border-slate-600 bg-slate-800/50 hover:border-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
      title={p.pathname}
    >
      {broken ? (
        <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] leading-tight text-amber-200/90">
          {t("adminHistorial.photoThumbError")}
        </span>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt=""
          className="h-16 w-16 object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
        />
      )}
    </button>
  );
}
