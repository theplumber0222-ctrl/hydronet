"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { OFFICIAL_LOGO_URL } from "@/lib/official-logo";
import {
  buildServicioSuccessMessage,
  servicioReportCopy,
  type ServicioLanguage,
} from "@/lib/servicio-report-copy";

type ChecklistKey = "airGap" | "handSink" | "greaseTrap";

const CHECKLIST_KEYS: ChecklistKey[] = ["airGap", "handSink", "greaseTrap"];

function checklistTitle(
  c: ReturnType<typeof servicioReportCopy>,
  key: ChecklistKey,
): string {
  if (key === "airGap") return c.checklistAirGap;
  if (key === "handSink") return c.checklistHandSink;
  return c.checklistGreaseTrap;
}

const STORAGE_ADMIN = "hydronet_servicio_admin_key";

export function ServicioEnSitioForm() {
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const [serviceLanguage, setServiceLanguage] =
    useState<ServicioLanguage>("es");
  const c = servicioReportCopy(serviceLanguage);

  const [adminKey, setAdminKey] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [serviceDate, setServiceDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [checklist, setChecklist] = useState<Record<ChecklistKey, string>>({
    airGap: "pass",
    handSink: "pass",
    greaseTrap: "pass",
  });
  const [notes, setNotes] = useState("");
  const [invoiceSubtotal, setInvoiceSubtotal] = useState<string>("");

  const [photosBefore, setPhotosBefore] = useState<File[]>([]);
  const [photosAfter, setPhotosAfter] = useState<File[]>([]);

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(STORAGE_ADMIN);
      if (s) setAdminKey(s);
    } catch {
      /* ignore */
    }
  }, []);

  const subtotalNum = parseFloat(invoiceSubtotal.replace(",", ".")) || 0;
  const deposit = 50;
  const amountDue = Math.max(0, Math.round((subtotalNum - deposit) * 100) / 100);

  const persistAdminKey = useCallback(() => {
    if (adminKey.trim()) {
      try {
        sessionStorage.setItem(STORAGE_ADMIN, adminKey.trim());
      } catch {
        /* ignore */
      }
    }
  }, [adminKey]);

  const onBeforeFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    setPhotosBefore((prev) => [...prev, ...Array.from(list)].slice(0, 6));
    e.target.value = "";
  };

  const onAfterFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    setPhotosAfter((prev) => [...prev, ...Array.from(list)].slice(0, 6));
    e.target.value = "";
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    persistAdminKey();

    let key = adminKey.trim();
    if (!key) {
      try {
        key = sessionStorage.getItem(STORAGE_ADMIN) ?? "";
      } catch {
        key = "";
      }
    }

    const fd = new FormData();
    fd.set("serviceLanguage", serviceLanguage);
    fd.set("restaurantName", restaurantName);
    fd.set("clientEmail", clientEmail);
    fd.set("technicianName", technicianName);
    fd.set("serviceDate", serviceDate);
    fd.set("checklistAirGap", checklist.airGap);
    fd.set("checklistHandSink", checklist.handSink);
    fd.set("checklistGreaseTrap", checklist.greaseTrap);
    fd.set("notes", notes);
    fd.set("invoiceSubtotal", String(subtotalNum));
    photosBefore.forEach((f, i) => fd.append(`photo_before_${i}`, f));
    photosAfter.forEach((f, i) => fd.append(`photo_after_${i}`, f));

    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (key) headers["x-hydronet-admin-key"] = key;

      const res = await fetch("/api/admin/servicio/report", {
        method: "POST",
        headers,
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error ?? "Error"),
        );
        return;
      }
      const due =
        typeof data.amountDue === "number"
          ? data.amountDue.toFixed(2)
          : amountDue.toFixed(2);
      setStatus(
        buildServicioSuccessMessage(serviceLanguage, clientEmail, due),
      );
    } catch {
      setError(c.networkError);
    } finally {
      setLoading(false);
    }
  }

  const passOpts = [
    { v: "pass" as const, label: c.pass },
    { v: "fail" as const, label: c.fail },
    { v: "na" as const, label: c.na },
  ];

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-3xl space-y-8 px-3 pb-24 pt-4"
    >
      <div className="sticky top-0 z-20 -mx-3 mb-2 flex items-center justify-between border-b border-slate-700 bg-[#1F2937]/95 px-3 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/" className="text-sm text-sky-400 hover:underline">
            {c.navHome}
          </Link>
          <Link href="/admin/cita" className="text-sm text-sky-400 hover:underline">
            {c.navJobCard}
          </Link>
          <Link href="/admin/estimados" className="text-sm text-sky-400 hover:underline">
            {c.navEstimates}
          </Link>
          <Link href="/admin/historial" className="text-sm text-sky-400 hover:underline">
            {c.navHistory}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{c.langLabel}:</span>
          <div className="inline-flex rounded-lg border border-slate-600 bg-slate-800/80 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setServiceLanguage("es")}
              className={`rounded-md px-2.5 py-1 font-medium ${
                serviceLanguage === "es"
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Español
            </button>
            <button
              type="button"
              onClick={() => setServiceLanguage("en")}
              className={`rounded-md px-2.5 py-1 font-medium ${
                serviceLanguage === "en"
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              English
            </button>
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {c.navMode}
          </span>
        </div>
      </div>

      <header className="text-center">
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          {c.pageTitle}
        </h1>
        <p className="mt-1 text-lg text-sky-400">{c.pageSubtitle}</p>
      </header>

      <section className="rounded-2xl border border-slate-600 bg-slate-800/40 p-4">
        <label className="label">{c.adminKeyLabel}</label>
        <p className="text-xs text-slate-500">{c.adminKeyHelp}</p>
        <input
          type="password"
          className="input-field"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          autoComplete="off"
          placeholder="••••••••"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">{c.establishmentLabel}</label>
          <p className="text-xs text-slate-500">{c.establishmentHelp}</p>
          <input
            className="input-field"
            required
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{c.clientEmailLabel}</label>
          <p className="text-xs text-slate-500">{c.clientEmailHelp}</p>
          <input
            className="input-field"
            type="email"
            required
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{c.technicianLabel}</label>
          <p className="text-xs text-slate-500">{c.technicianHelp}</p>
          <input
            className="input-field"
            required
            value={technicianName}
            onChange={(e) => setTechnicianName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{c.serviceDateLabel}</label>
          <p className="text-xs text-slate-500">{c.serviceDateHelp}</p>
          <input
            className="input-field"
            type="date"
            required
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-600 bg-slate-800/40 p-4">
        <h2 className="text-xl font-semibold text-sky-400">{c.checklistTitle}</h2>
        <p className="text-sm text-slate-500">{c.checklistHelp}</p>
        <div className="mt-6 space-y-8">
          {CHECKLIST_KEYS.map((key) => (
            <div
              key={key}
              className="border-t border-slate-700 pt-6 first:border-0 first:pt-0"
            >
              <p className="font-medium text-slate-100">
                {checklistTitle(c, key)}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                {passOpts.map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() =>
                      setChecklist((prev) => ({ ...prev, [key]: opt.v }))
                    }
                    className={`min-h-[3.5rem] rounded-xl border-2 px-2 py-3 text-center text-sm font-semibold transition sm:min-h-[4rem] sm:text-base ${
                      checklist[key] === opt.v
                        ? opt.v === "pass"
                          ? "border-emerald-500 bg-emerald-950/50 text-emerald-300"
                          : opt.v === "fail"
                            ? "border-red-500 bg-red-950/40 text-red-200"
                            : "border-slate-400 bg-slate-700/80 text-slate-200"
                        : "border-slate-600 bg-slate-900/60 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <input
          ref={beforeInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={onBeforeFiles}
        />
        <input
          ref={afterInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={onAfterFiles}
        />
        <div>
          <button
            type="button"
            onClick={() => beforeInputRef.current?.click()}
            className="flex min-h-[5.5rem] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-500/60 bg-sky-950/20 px-4 py-6 text-lg font-bold text-sky-300 transition hover:bg-sky-950/40"
          >
            <span className="text-3xl" aria-hidden>
              📷
            </span>
            <span>{c.photosBefore}</span>
            <span className="text-sm font-normal text-sky-400/80">
              {c.photosBeforeSub}
            </span>
          </button>
          <PhotoChips
            files={photosBefore}
            onRemove={setPhotosBefore}
            removeAria={c.removePhotoAria}
          />
        </div>
        <div>
          <button
            type="button"
            onClick={() => afterInputRef.current?.click()}
            className="flex min-h-[5.5rem] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-500/60 bg-orange-950/20 px-4 py-6 text-lg font-bold text-orange-300 transition hover:bg-orange-950/40"
          >
            <span className="text-3xl" aria-hidden>
              📷
            </span>
            <span>{c.photosAfter}</span>
            <span className="text-sm font-normal text-orange-400/80">
              {c.photosAfterSub}
            </span>
          </button>
          <PhotoChips
            files={photosAfter}
            onRemove={setPhotosAfter}
            removeAria={c.removePhotoAria}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-600 bg-slate-800/40 p-4">
        <label className="label">{c.notesLabel}</label>
        <p className="text-xs text-slate-500">{c.notesHelp}</p>
        <textarea
          className="input-field min-h-[100px] resize-y"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={4000}
        />
      </section>

      <section
        className="rounded-2xl border border-slate-500 bg-white p-6 text-slate-900 shadow-sm print:border print:shadow-none"
        aria-label={c.invoicePreviewTitle}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {c.invoicePreviewTitle}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{c.invoicePreviewHint}</p>
        <div className="mt-4 border-b border-slate-200 pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={OFFICIAL_LOGO_URL}
            alt=""
            width={880}
            height={224}
            decoding="async"
            className="block h-auto max-h-56 w-auto max-w-[min(880px,96vw)] object-contain object-left"
          />
        </div>
        <p className="mt-4 text-center text-xl font-bold text-slate-900">
          {c.pdfTitle}
        </p>
        <p className="mt-2 text-center text-xs text-slate-500">
          {new Date().toLocaleString(
            serviceLanguage === "es" ? "es-US" : "en-US",
            {
              timeZone: "America/Chicago",
              dateStyle: "full",
              timeStyle: "short",
            },
          )}{" "}
          (TN)
        </p>
      </section>

      <section className="rounded-2xl border border-orange-500/30 bg-slate-900/60 p-5">
        <h2 className="text-xl font-semibold text-orange-400">{c.billingTitle}</h2>
        <label className="label mt-4">{c.subtotalLabel}</label>
        <p className="text-xs text-slate-500">{c.subtotalHelp}</p>
        <input
          className="input-field text-2xl font-bold"
          inputMode="decimal"
          required
          value={invoiceSubtotal}
          onChange={(e) => setInvoiceSubtotal(e.target.value)}
          placeholder="0.00"
        />
        <div className="mt-4 space-y-2 rounded-xl bg-slate-800/80 p-4 text-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
            <span>{c.depositRow}</span>
            <span className="font-mono text-sky-400">-$50.00</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-600 pt-3 text-xl font-bold text-white">
            <span>{c.totalRow}</span>
            <span className="font-mono text-orange-400">
              ${amountDue.toFixed(2)}
            </span>
          </div>
          <p className="text-xs font-normal text-slate-500">{c.totalRowHelp}</p>
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-red-950/50 px-4 py-3 text-red-200">
          {error}
        </p>
      )}
      {status && (
        <p className="rounded-xl bg-emerald-950/50 px-4 py-3 text-emerald-200">
          {status}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="fixed bottom-0 left-0 right-0 z-10 mx-auto max-w-3xl rounded-t-2xl bg-[#F97316] py-5 text-center text-xl font-bold text-white shadow-[0_-8px_32px_rgba(0,0,0,0.4)] disabled:opacity-60 sm:relative sm:rounded-2xl sm:py-6 sm:shadow-lg"
      >
        {loading ? c.submitLoading : c.submitIdle}
      </button>
    </form>
  );
}

function PhotoChips({
  files,
  onRemove,
  removeAria,
}: {
  files: File[];
  onRemove: React.Dispatch<React.SetStateAction<File[]>>;
  removeAria: string;
}) {
  if (files.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {files.map((f, i) => (
        <li
          key={`${f.name}-${i}`}
          className="flex items-center gap-1 rounded-lg bg-slate-700 px-2 py-1 text-xs text-slate-200"
        >
          <span className="max-w-[120px] truncate">{f.name}</span>
          <button
            type="button"
            className="text-red-400 hover:text-red-300"
            onClick={() => onRemove((prev) => prev.filter((_, j) => j !== i))}
            aria-label={removeAria}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
