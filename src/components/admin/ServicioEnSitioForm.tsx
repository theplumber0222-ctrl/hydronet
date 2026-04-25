"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { OFFICIAL_LOGO_URL } from "@/lib/official-logo";
import {
  clearEntireServicioDraft,
  loadDraftFromLocalStorage,
  loadPhotoSide,
  persistFullDraft,
  type ServicioDraftV1,
} from "@/lib/servicio-form-draft";
import {
  fileSlotKey,
  inferMimeFromFilename,
  tryCanvasJpegDataUrl,
} from "@/lib/servicio-photo-thumb";
import {
  buildServicioSuccessMessage,
  servicioReportCopy,
  type ServicioLanguage,
} from "@/lib/servicio-report-copy";
import { CONNECT_DEPOSIT_USD, HOURLY_PLUMBING_RATE_USD } from "@/lib/stripe";

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
/** Mínimo USD en Stripe para pago con tarjeta (alineado con API charge). */
const MIN_CARD_CHARGE_USD = 0.5;
const DRAFT_SAVE_MS = 450;

function defaultServiceDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseMoneyField(s: string): number {
  const t = s.trim().replace(",", ".");
  if (t === "") return 0;
  const n = parseFloat(t);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Horas (decimales permitidos; no redondea la entrada, solo descarta &lt; 0). */
function parseNonNegativeHours(s: string): number {
  const t = s.trim().replace(",", ".");
  if (t === "") return 0;
  const n = parseFloat(t);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function ServicioEnSitioForm() {
  /** Un solo input: iOS/Safari a veces no entregan archivos fiables al 2.º de dos inputs. */
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoPickSideRef = useRef<"before" | "after">("before");

  const [serviceLanguage, setServiceLanguage] =
    useState<ServicioLanguage>("es");
  const c = servicioReportCopy(serviceLanguage);

  const [adminKey, setAdminKey] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [serviceDate, setServiceDate] = useState(defaultServiceDateString);
  const [checklist, setChecklist] = useState<Record<ChecklistKey, string>>({
    airGap: "pass",
    handSink: "pass",
    greaseTrap: "pass",
  });
  const [notes, setNotes] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [materialsSubtotal, setMaterialsSubtotal] = useState("");
  const [partsSubtotal, setPartsSubtotal] = useState("");
  const [otherChargesSubtotal, setOtherChargesSubtotal] = useState("");

  const [photosBefore, setPhotosBefore] = useState<File[]>([]);
  const [photosAfter, setPhotosAfter] = useState<File[]>([]);

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chargeLoading, setChargeLoading] = useState(false);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [paymentReturn, setPaymentReturn] = useState<"success" | "cancelled" | null>(
    null,
  );
  const [draftHydrated, setDraftHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = loadDraftFromLocalStorage();
        const beforeFiles = await loadPhotoSide("before");
        const afterFiles = await loadPhotoSide("after");
        if (cancelled) return;
        if (t?.v === 1) {
          if (t.serviceLanguage === "en" || t.serviceLanguage === "es")
            setServiceLanguage(t.serviceLanguage);
          if (t.adminKey != null) {
            setAdminKey(t.adminKey);
            if (t.adminKey.trim()) {
              try {
                sessionStorage.setItem(STORAGE_ADMIN, t.adminKey.trim());
              } catch {
                /* ignore */
              }
            }
          } else {
            try {
              const s = sessionStorage.getItem(STORAGE_ADMIN);
              if (s) setAdminKey(s);
            } catch {
              /* ignore */
            }
          }
          if (t.restaurantName != null) setRestaurantName(t.restaurantName);
          if (t.bookingReference != null) setBookingReference(t.bookingReference);
          if (t.clientEmail != null) setClientEmail(t.clientEmail);
          if (t.technicianName != null) setTechnicianName(t.technicianName);
          if (t.serviceDate != null) setServiceDate(t.serviceDate);
          if (t.checklist) setChecklist(t.checklist);
          if (t.notes != null) setNotes(t.notes);
          if (t.laborHours != null) setLaborHours(t.laborHours);
          if (t.materialsSubtotal != null) setMaterialsSubtotal(t.materialsSubtotal);
          if (t.partsSubtotal != null) setPartsSubtotal(t.partsSubtotal);
          if (t.otherChargesSubtotal != null)
            setOtherChargesSubtotal(t.otherChargesSubtotal);
        } else {
          try {
            const s = sessionStorage.getItem(STORAGE_ADMIN);
            if (s) setAdminKey(s);
          } catch {
            /* ignore */
          }
        }
        if (beforeFiles.length) setPhotosBefore(beforeFiles);
        if (afterFiles.length) setPhotosAfter(afterFiles);
      } catch {
        try {
          const s = sessionStorage.getItem(STORAGE_ADMIN);
          if (s) setAdminKey(s);
        } catch {
          /* ignore */
        }
      } finally {
        if (!cancelled) setDraftHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const pay = p.get("payment");
    if (pay === "success") {
      setPaymentReturn("success");
    } else if (pay === "cancelled") {
      setPaymentReturn("cancelled");
    }
    if (pay === "success" || pay === "cancelled") {
      window.history.replaceState(
        {},
        "",
        window.location.pathname + window.location.hash,
      );
    }
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    const draft: ServicioDraftV1 = {
      v: 1,
      serviceLanguage,
      adminKey,
      restaurantName,
      bookingReference,
      clientEmail,
      technicianName,
      serviceDate,
      checklist,
      notes,
      laborHours,
      materialsSubtotal,
      partsSubtotal,
      otherChargesSubtotal,
    };
    const id = setTimeout(() => {
      void persistFullDraft(draft, photosBefore, photosAfter);
      if (adminKey.trim()) {
        try {
          sessionStorage.setItem(STORAGE_ADMIN, adminKey.trim());
        } catch {
          /* ignore */
        }
      }
    }, DRAFT_SAVE_MS);
    return () => clearTimeout(id);
  }, [
    draftHydrated,
    serviceLanguage,
    adminKey,
    restaurantName,
    bookingReference,
    clientEmail,
    technicianName,
    serviceDate,
    checklist,
    notes,
    laborHours,
    materialsSubtotal,
    partsSubtotal,
    otherChargesSubtotal,
    photosBefore,
    photosAfter,
  ]);

  const laborH = parseNonNegativeHours(laborHours);
  const laborSubtotal = round2(laborH * HOURLY_PLUMBING_RATE_USD);
  const materialsN = parseMoneyField(materialsSubtotal);
  const partsN = parseMoneyField(partsSubtotal);
  const otherN = parseMoneyField(otherChargesSubtotal);
  const invoiceSubtotal = round2(
    laborSubtotal + materialsN + partsN + otherN,
  );
  const deposit = CONNECT_DEPOSIT_USD;
  const amountDue = Math.max(0, round2(invoiceSubtotal - deposit));
  const canChargeByCard =
    amountDue >= MIN_CARD_CHARGE_USD;

  const persistAdminKey = useCallback(() => {
    if (adminKey.trim()) {
      try {
        sessionStorage.setItem(STORAGE_ADMIN, adminKey.trim());
      } catch {
        /* ignore */
      }
    }
  }, [adminKey]);

  const buildDraft = useCallback((): ServicioDraftV1 => {
    return {
      v: 1,
      serviceLanguage,
      adminKey,
      restaurantName,
      bookingReference,
      clientEmail,
      technicianName,
      serviceDate,
      checklist,
      notes,
      laborHours,
      materialsSubtotal,
      partsSubtotal,
      otherChargesSubtotal,
    };
  }, [
    serviceLanguage,
    adminKey,
    restaurantName,
    bookingReference,
    clientEmail,
    technicianName,
    serviceDate,
    checklist,
    notes,
    laborHours,
    materialsSubtotal,
    partsSubtotal,
    otherChargesSubtotal,
  ]);

  const resetFormForNewReport = useCallback(() => {
    void clearEntireServicioDraft();
    try {
      sessionStorage.removeItem(STORAGE_ADMIN);
    } catch {
      /* ignore */
    }
    setServiceLanguage("es");
    setAdminKey("");
    setRestaurantName("");
    setBookingReference("");
    setClientEmail("");
    setTechnicianName("");
    setServiceDate(defaultServiceDateString());
    setChecklist({ airGap: "pass", handSink: "pass", greaseTrap: "pass" });
    setNotes("");
    setLaborHours("");
    setMaterialsSubtotal("");
    setPartsSubtotal("");
    setOtherChargesSubtotal("");
    setPhotosBefore([]);
    setPhotosAfter([]);
    setError(null);
  }, []);

  const handleClearDraft = useCallback(() => {
    resetFormForNewReport();
    setStatus(null);
    setPaymentReturn(null);
    setChargeError(null);
  }, [resetFormForNewReport]);

  const onPhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const add = (prev: File[]) =>
      [...prev, ...Array.from(list)].slice(0, 6);
    if (photoPickSideRef.current === "before") {
      setPhotosBefore(add);
    } else {
      setPhotosAfter(add);
    }
    e.target.value = "";
  };

  const openPhotoPicker = (side: "before" | "after") => {
    photoPickSideRef.current = side;
    photoInputRef.current?.click();
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
    fd.set("bookingReference", bookingReference.trim());
    fd.set("clientEmail", clientEmail);
    fd.set("technicianName", technicianName);
    fd.set("serviceDate", serviceDate);
    fd.set("checklistAirGap", checklist.airGap);
    fd.set("checklistHandSink", checklist.handSink);
    fd.set("checklistGreaseTrap", checklist.greaseTrap);
    fd.set("notes", notes);
    fd.set("laborHours", String(laborH));
    fd.set("materialsSubtotal", String(materialsN));
    fd.set("partsSubtotal", String(partsN));
    fd.set("otherChargesSubtotal", String(otherN));
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
      resetFormForNewReport();
    } catch {
      setError(c.networkError);
    } finally {
      setLoading(false);
    }
  }

  async function onChargeByCard() {
    setChargeError(null);
    setPaymentReturn(null);
    await persistFullDraft(buildDraft(), photosBefore, photosAfter);
    persistAdminKey();
    let key = adminKey.trim();
    if (!key) {
      try {
        key = sessionStorage.getItem(STORAGE_ADMIN) ?? "";
      } catch {
        key = "";
      }
    }
    if (!canChargeByCard) {
      if (amountDue <= 0) {
        setChargeError(c.noBalanceToCharge);
        return;
      }
      setChargeError(c.chargeMinStripe);
      return;
    }

    setChargeLoading(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (key) headers["x-hydronet-admin-key"] = key;

      const res = await fetch("/api/admin/servicio/charge", {
        method: "POST",
        headers,
        body: JSON.stringify({
          serviceLanguage,
          bookingReference: bookingReference.trim(),
          clientEmail: clientEmail.trim(),
          houseOrBusinessName: restaurantName.trim(),
          technician: technicianName.trim(),
          serviceDate: serviceDate.trim(),
          laborHours: laborH,
          materialsSubtotal: materialsN,
          partsSubtotal: partsN,
          otherChargesSubtotal: otherN,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setChargeError(
          typeof data.error === "string" ? data.error : c.chargeError,
        );
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setChargeError(c.chargeError);
    } catch {
      setChargeError(c.chargeError);
    } finally {
      setChargeLoading(false);
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
          <Link href="/admin/agenda" className="text-sm text-sky-400 hover:underline">
            {c.navAgenda}
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
        <div className="mt-4 flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-sm text-slate-400 underline decoration-slate-500 underline-offset-2 hover:text-slate-200"
          >
            {c.clearDraftButton}
          </button>
          <p className="max-w-md text-center text-xs text-slate-500">
            {c.clearDraftHelp}
          </p>
        </div>
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
          <label className="label">{c.pdfBookingRef}</label>
          <p className="text-xs text-slate-500">
            {serviceLanguage === "es"
              ? "Opcional — ID de reserva (cuid) para vincular el informe."
              : "Optional — booking ID (cuid) to link this report."}
          </p>
          <input
            className="input-field font-mono text-sm"
            autoComplete="off"
            value={bookingReference}
            onChange={(e) => setBookingReference(e.target.value)}
            placeholder="clq…"
            maxLength={200}
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
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={onPhotoInputChange}
        />
        <div>
          <button
            type="button"
            onClick={() => openPhotoPicker("before")}
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
          <PhotoThumbnails
            key="servicio-photo-thumbs-before"
            files={photosBefore}
            onRemove={setPhotosBefore}
            removeAria={c.removePhotoAria}
            tone="before"
            caption={c.photoCountInline}
            previewHint={c.photoPreviewUnavailable}
            typeLabel={c.photoTypeLabel}
            indexLabel={c.photoIndexLabel}
            openPreviewAria={c.openPhotoPreviewAria}
            closePhotoPreview={c.closePhotoPreview}
          />
        </div>
        <div>
          <button
            type="button"
            onClick={() => openPhotoPicker("after")}
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
          <PhotoThumbnails
            key="servicio-photo-thumbs-after"
            files={photosAfter}
            onRemove={setPhotosAfter}
            removeAria={c.removePhotoAria}
            tone="after"
            caption={c.photoCountInline}
            previewHint={c.photoPreviewUnavailable}
            typeLabel={c.photoTypeLabel}
            indexLabel={c.photoIndexLabel}
            openPreviewAria={c.openPhotoPreviewAria}
            closePhotoPreview={c.closePhotoPreview}
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
        <p className="mt-1 text-sm text-slate-500">{c.billingSectionHelp}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{c.laborHoursLabel}</label>
            <input
              className="input-field font-mono"
              inputMode="decimal"
              value={laborHours}
              onChange={(e) => setLaborHours(e.target.value)}
              placeholder="0"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label">{c.hourlyRateReadonlyLabel}</label>
            <p className="input-field font-mono text-slate-200">
              ${HOURLY_PLUMBING_RATE_USD.toFixed(2)}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">{c.laborSubtotalReadonlyLabel}</label>
            <p className="input-field font-mono text-slate-100">
              ${laborSubtotal.toFixed(2)}
            </p>
          </div>
          <div>
            <label className="label">{c.materialsSubtotalLabel}</label>
            <input
              className="input-field font-mono"
              inputMode="decimal"
              value={materialsSubtotal}
              onChange={(e) => setMaterialsSubtotal(e.target.value)}
              placeholder="0.00"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label">{c.partsSubtotalLabel}</label>
            <input
              className="input-field font-mono"
              inputMode="decimal"
              value={partsSubtotal}
              onChange={(e) => setPartsSubtotal(e.target.value)}
              placeholder="0.00"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label">{c.otherChargesSubtotalLabel}</label>
            <input
              className="input-field font-mono"
              inputMode="decimal"
              value={otherChargesSubtotal}
              onChange={(e) => setOtherChargesSubtotal(e.target.value)}
              placeholder="0.00"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="mt-4 space-y-2 rounded-xl bg-slate-800/80 p-4 text-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
            <span>{c.aggregatedSubtotalLabel}</span>
            <span className="font-mono text-slate-200">
              ${invoiceSubtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
            <span>{c.depositRow}</span>
            <span className="font-mono text-sky-400">
              -${deposit.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-600 pt-3 text-xl font-bold text-white">
            <span>{c.totalRow}</span>
            <span className="font-mono text-orange-400">
              ${amountDue.toFixed(2)}
            </span>
          </div>
          <p className="text-xs font-normal text-slate-500">{c.totalRowHelp}</p>
        </div>

        <div className="mt-5 border-t border-orange-500/20 pt-5">
          <p className="text-sm text-slate-500">{c.chargeHelp}</p>
          <button
            type="button"
            onClick={onChargeByCard}
            disabled={chargeLoading || !canChargeByCard}
            className="mt-3 w-full rounded-xl border-2 border-emerald-500/60 bg-emerald-950/40 py-3 text-lg font-semibold text-emerald-200 transition hover:bg-emerald-950/60 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {chargeLoading ? c.chargeLoading : c.chargeButton}
          </button>
          {!canChargeByCard && (
            <p className="mt-2 text-sm text-slate-500">
              {amountDue <= 0 ? c.noBalanceToCharge : c.chargeMinStripe}
            </p>
          )}
          {chargeError && (
            <p className="mt-2 text-sm text-red-300">{chargeError}</p>
          )}
        </div>
      </section>

      {paymentReturn === "success" && (
        <p className="rounded-xl bg-sky-950/50 px-4 py-3 text-sky-200">
          {c.paymentSuccessReturn}
        </p>
      )}
      {paymentReturn === "cancelled" && (
        <p className="rounded-xl bg-amber-950/50 px-4 py-3 text-amber-100">
          {c.paymentCancelledReturn}
        </p>
      )}

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

function PhotoThumbnails({
  files,
  onRemove,
  removeAria,
  tone,
  caption,
  previewHint,
  typeLabel,
  indexLabel,
  openPreviewAria,
  closePhotoPreview,
}: {
  files: File[];
  onRemove: React.Dispatch<React.SetStateAction<File[]>>;
  removeAria: string;
  tone: "before" | "after";
  caption: (n: number) => string;
  previewHint: string;
  typeLabel: string;
  indexLabel: (i: number, total: number) => string;
  openPreviewAria: string;
  closePhotoPreview: string;
}) {
  const filesKey = useMemo(
    () =>
      files
        .map(
          (f, i) =>
            `${i}:${f.name}\0${f.size}\0${f.lastModified}\0${f.type || inferMimeFromFilename(f.name) || ""}`,
        )
        .join("|"),
    [files],
  );

  const filesRef = useRef(files);
  filesRef.current = files;

  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [canvasJpegs, setCanvasJpegs] = useState<(string | null)[]>([]);
  const [blobLoadFailed, setBlobLoadFailed] = useState<boolean[]>([]);
  const [canvasDecodeDone, setCanvasDecodeDone] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useLayoutEffect(() => {
    setLightbox(null);
    const list = filesRef.current;
    if (list.length === 0) {
      setBlobUrls([]);
      setCanvasJpegs([]);
      setBlobLoadFailed([]);
      setCanvasDecodeDone(false);
      return;
    }
    const next = list.map((f) => URL.createObjectURL(f));
    setBlobUrls(next);
    setCanvasJpegs(list.map(() => null));
    setBlobLoadFailed(list.map(() => false));
    setCanvasDecodeDone(false);

    let cancelled = false;
    (async () => {
      const jpegs = await Promise.all(
        list.map((f) => tryCanvasJpegDataUrl(f, 200, 0.82)),
      );
      if (!cancelled) {
        setCanvasJpegs(jpegs);
        setCanvasDecodeDone(true);
      }
    })();

    return () => {
      cancelled = true;
      next.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [filesKey]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  if (files.length === 0) return null;
  const border =
    tone === "before" ? "border-sky-500/50" : "border-orange-500/50";
  const phTint =
    tone === "before" ? "bg-sky-950/60" : "bg-orange-950/60";
  const countLine = caption(files.length);

  return (
    <>
    <div className="mt-3">
      <p className="mb-2 text-sm font-medium text-slate-300">
        {countLine}
      </p>
      <ul className="flex flex-wrap gap-2" aria-label={countLine}>
        {files.map((f, i) => {
          const mime =
            f.type?.trim() ||
            inferMimeFromFilename(f.name) ||
            "—";
          const jpg = canvasJpegs[i] ?? null;
          const burl = blobUrls[i];
          const useBlob = !jpg && Boolean(burl) && !blobLoadFailed[i];
          const hasDisplay = Boolean(jpg) || (Boolean(burl) && !blobLoadFailed[i]);
          const showNoThumbHint = canvasDecodeDone && !hasDisplay;
          const previewTarget =
            burl && !blobLoadFailed[i] ? burl : jpg ?? burl ?? null;
          const canOpenPreview = Boolean(previewTarget);

          return (
            <li
              key={fileSlotKey(f, i)}
              className={`relative h-20 w-20 touch-manipulation overflow-hidden rounded-lg border ${border} ${phTint} shadow-inner ${
                canOpenPreview ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <div
                className="absolute inset-0 z-0 flex flex-col justify-between gap-0.5 p-1.5"
                aria-hidden
              >
                <span className="line-clamp-1 text-center text-[8px] font-medium leading-tight text-slate-200">
                  {indexLabel(i, files.length)}
                </span>
                <span
                  className="line-clamp-2 min-h-0 flex-1 break-all text-left text-[7px] leading-tight text-slate-300/95"
                  title={f.name}
                >
                  {f.name || "—"}
                </span>
                <span className="line-clamp-1 text-left text-[7px] text-slate-400">
                  {typeLabel}: {mime}
                </span>
                {showNoThumbHint ? (
                  <span className="line-clamp-2 text-left text-[6.5px] leading-tight text-amber-200/90">
                    {previewHint}
                  </span>
                ) : null}
              </div>
              {jpg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={jpg}
                  alt=""
                  className="pointer-events-none absolute inset-0 z-20 h-full w-full object-cover"
                />
              ) : useBlob && burl ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob: URL
                <img
                  src={burl}
                  alt=""
                  className="pointer-events-none absolute inset-0 z-20 h-full w-full object-cover"
                  onError={() => {
                    setBlobLoadFailed((prev) => {
                      const n = [...prev];
                      n[i] = true;
                      return n;
                    });
                  }}
                />
              ) : null}
              {canOpenPreview ? (
                <button
                  type="button"
                  className="absolute inset-0 z-[25] m-0 min-h-0 min-w-0 touch-manipulation border-0 bg-transparent p-0"
                  onClick={() => setLightbox(previewTarget!)}
                  aria-label={`${openPreviewAria} — ${f.name || "image"}`}
                />
              ) : null}
              <button
                type="button"
                className="absolute right-0 top-0 z-30 touch-manipulation rounded-bl bg-black/60 px-1.5 text-sm font-bold leading-tight text-red-200 hover:bg-black/80"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove((prev) => prev.filter((_, j) => j !== i));
                }}
                aria-label={removeAria}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </div>
    {lightbox && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={openPreviewAria}
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              className="absolute right-2 top-2 z-10 min-h-11 min-w-11 touch-manipulation rounded-lg bg-slate-800/90 px-3 text-2xl leading-none text-slate-100"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(null);
              }}
              aria-label={closePhotoPreview}
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
              alt=""
              className="max-h-[90dvh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )
      : null}
    </>
  );
}
