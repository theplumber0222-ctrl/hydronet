"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { OFFICIAL_LOGO_URL } from "@/lib/official-logo";
import {
  clearEntireServicioDraft,
  loadDraftFromLocalStorage,
  loadPhotoSide,
  persistFullDraft,
  type ServicioDraftV1,
} from "@/lib/servicio-form-draft";
import {
  buildServicioSuccessMessage,
  servicioReportCopy,
  type ServicioLanguage,
} from "@/lib/servicio-report-copy";
import { compressServicioPhotoToJpeg } from "@/lib/servicio-photo-compress";
import { computeServicioBilling } from "@/lib/servicio-billing-math";

type UploadedPhotoRef = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
};

function generateReportId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, "");
  return `srv${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Sube UNA foto (JPEG) al origen de la app; el servidor la escribe en Vercel
 * Blob. Evita el flujo anterior cliente→Blob directo, que en Safari/iPad
 * a menudo no completaba aun con token 200.
 */
async function uploadOnePhotoViaServer(
  file: File,
  reportId: string,
  side: "before" | "after",
  index: number,
  adminKey: string,
): Promise<UploadedPhotoRef> {
  const fd = new FormData();
  fd.set("file", file, file.name || "photo.jpg");
  fd.set("reportId", reportId);
  fd.set("side", side);
  fd.set("index", String(index));
  const headers: HeadersInit = {};
  if (adminKey) headers["x-hydronet-admin-key"] = adminKey;
  const res = await fetch("/api/admin/servicio/photo-upload", {
    method: "POST",
    body: fd,
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    url?: string;
    pathname?: string;
    contentType?: string;
    size?: number;
  };
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Error al subir la foto",
    );
  }
  if (!data.url || !data.pathname) {
    throw new Error("Respuesta de subida inválida");
  }
  return {
    url: data.url,
    pathname: data.pathname,
    contentType: data.contentType || "image/jpeg",
    size: typeof data.size === "number" ? data.size : file.size,
  };
}

function servicioSubmitStepLabel(
  lang: ServicioLanguage,
  step: "before" | "after" | "report",
): string {
  if (lang === "en") {
    if (step === "before") return "Uploading photos (before)…";
    if (step === "after") return "Uploading photos (after)…";
    return "Sending report…";
  }
  if (step === "before") return "Subiendo fotos (antes)…";
  if (step === "after") return "Subiendo fotos (después)…";
  return "Enviando reporte…";
}

type PhotoPhase = {
  side: "before" | "after";
  index0: number;
  total: number;
  phase: "compress" | "upload";
};

function servicioPhotoProgressLabel(
  lang: ServicioLanguage,
  p: PhotoPhase,
): string {
  const n = p.index0 + 1;
  const t = p.total;
  const sideEN = p.side === "before" ? "before" : "after";
  const sideES = p.side === "before" ? "antes" : "después";
  if (lang === "en") {
    if (p.phase === "compress") {
      return `Optimizing photo ${n}/${t} (${sideEN})…`;
    }
    return `Uploading photo ${n}/${t} (${sideEN})…`;
  }
  if (p.phase === "compress") {
    return `Comprimiendo foto ${n}/${t} (${sideES})…`;
  }
  return `Subiendo foto ${n}/${t} (${sideES})…`;
}

/**
 * Comprime a JPEG (canvas) y sube vía el servidor (misma app) a Vercel Blob.
 * Las refs reflejan el archivo optimizado, no el original.
 */
async function uploadPhotoSideDirect(
  side: "before" | "after",
  files: File[],
  reportId: string,
  adminKey: string,
  onPhotoPhase?: (p: PhotoPhase) => void,
): Promise<UploadedPhotoRef[]> {
  const out: UploadedPhotoRef[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    onPhotoPhase?.({ side, index0: i, total: files.length, phase: "compress" });
    let optimized: File;
    try {
      optimized = await compressServicioPhotoToJpeg(f);
    } catch (optErr) {
      const name = f.name || "foto";
      throw new Error(
        optErr instanceof Error
          ? `${optErr.message} (${name})`
          : `No se pudo optimizar la imagen. (${name})`,
      );
    }
    onPhotoPhase?.({ side, index0: i, total: files.length, phase: "upload" });
    const result = await uploadOnePhotoViaServer(
      optimized,
      reportId,
      side,
      i,
      adminKey,
    );
    out.push({
      url: result.url,
      pathname: result.pathname,
      contentType: "image/jpeg",
      size: result.size,
    });
  }
  return out;
}

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
/** `reportId` fijado antes de redirigir a Checkout (coincide con subida a Blob). */
const STORAGE_CHECKOUT = "hydronet_servicio_checkout";
/**
 * Tras volver de Stripe: reintento del envío o recarga de página (la query se limpia).
 */
const STORAGE_POST_PAY = "hydronet_servicio_post_checkout";
/** Mínimo USD en Stripe para pago con tarjeta (alineado con API charge). */
const MIN_CARD_CHARGE_USD = 0.5;
const DRAFT_SAVE_MS = 450;
/** Evita doble auto-envío (React Strict en dev) al volver de Stripe. */
let postCheckoutAutorunInFlight = false;

/**
 * FileList → File[] estable para React.
 * No re-envolvemos con `new File([f], ...)` porque en iPad/Safari ese
 * constructor puede lanzar sobre Files recién entregados por la cámara,
 * abortando el handler antes de los setters de estado.
 * Las referencias originales del FileList son Blobs válidos; React puede
 * mantenerlas y la capa de IDB las lee vía FileReader.
 */
function cloneFilesForState(list: FileList): File[] {
  const out: File[] = [];
  for (let i = 0; i < list.length; i++) {
    const f = list.item(i);
    if (f) out.push(f);
  }
  return out;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

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

/** Horas (decimales permitidos; no redondea la entrada, solo descarta &lt; 0). */
function parseNonNegativeHours(s: string): number {
  const t = s.trim().replace(",", ".");
  if (t === "") return 0;
  const n = parseFloat(t);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function ServicioEnSitioForm() {
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
  /** Paso visible durante el submit (subida Blob / envío del reporte). */
  const [submitStep, setSubmitStep] = useState<string | null>(null);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [postCheckoutReady, setPostCheckoutReady] = useState<{
    reportId: string;
    sessionId: string;
  } | null>(null);
  const [postCheckoutFailed, setPostCheckoutFailed] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const skipHydrateBeforeRef = useRef(false);
  const skipHydrateAfterRef = useRef(false);
  /**
   * Se pone en `true` al hacer reset (post-submit o "Limpiar borrador"). Bloquea
   * cualquier `loadPhotoSide` que aún esté en vuelo desde el mount inicial para
   * que no rehidrate fotos de un reporte ya cerrado.
   */
  const submittedRef = useRef(false);
  const runReportPipelineRef = useRef(
    null as
      | ((
          reportId: string,
          stripeSessionId: string | null,
        ) => Promise<boolean>)
      | null,
  );
  const postCheckoutAutorunKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = loadDraftFromLocalStorage();
        const beforeFiles = await loadPhotoSide("before");
        const afterFiles = await loadPhotoSide("after");
        if (cancelled) return;
        if (submittedRef.current) return;
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
        if (
          !submittedRef.current &&
          !skipHydrateBeforeRef.current &&
          beforeFiles.length
        ) {
          setPhotosBefore(beforeFiles);
        }
        if (
          !submittedRef.current &&
          !skipHydrateAfterRef.current &&
          afterFiles.length
        ) {
          setPhotosAfter(afterFiles);
        }
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
    const sessionId = p.get("session_id");
    if (pay === "success" && sessionId) {
      let reportId: string | undefined;
      try {
        const raw = sessionStorage.getItem(STORAGE_CHECKOUT);
        if (raw) {
          const o = JSON.parse(raw) as { v?: number; reportId?: string };
          if (o?.v === 1 && o.reportId) reportId = o.reportId;
        }
      } catch {
        /* ignore */
      }
      if (reportId) {
        const payload = { v: 1 as const, reportId, sessionId };
        setPostCheckoutReady({ reportId, sessionId });
        try {
          sessionStorage.setItem(STORAGE_POST_PAY, JSON.stringify(payload));
        } catch {
          /* ignore */
        }
      } else {
        let lang2: ServicioLanguage = "es";
        try {
          const t = loadDraftFromLocalStorage();
          if (t?.v === 1 && (t.serviceLanguage === "en" || t.serviceLanguage === "es")) {
            lang2 = t.serviceLanguage;
          }
        } catch {
          /* ignore */
        }
        setError(servicioReportCopy(lang2).apiPaymentRequired);
      }
    } else if (pay === "cancelled") {
      let lang: ServicioLanguage = "es";
      try {
        const t = loadDraftFromLocalStorage();
        if (t?.v === 1 && (t.serviceLanguage === "en" || t.serviceLanguage === "es")) {
          lang = t.serviceLanguage;
        }
      } catch {
        /* ignore */
      }
      setChargeError(servicioReportCopy(lang).paymentCancelledReturn);
      try {
        sessionStorage.removeItem(STORAGE_CHECKOUT);
        sessionStorage.removeItem(STORAGE_POST_PAY);
      } catch {
        /* ignore */
      }
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
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("payment")) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_POST_PAY);
      if (!raw) return;
      const o = JSON.parse(raw) as {
        v?: number;
        reportId?: string;
        sessionId?: string;
      };
      if (o?.v === 1 && o.reportId && o.sessionId) {
        setPostCheckoutReady({ reportId: o.reportId, sessionId: o.sessionId });
      }
    } catch {
      /* ignore */
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
  const materialsN = parseMoneyField(materialsSubtotal);
  const partsN = parseMoneyField(partsSubtotal);
  const otherN = parseMoneyField(otherChargesSubtotal);
  const billingSnap = useMemo(
    () =>
      computeServicioBilling({
        laborHours: laborH,
        materialsSubtotal: materialsN,
        partsSubtotal: partsN,
        otherChargesSubtotal: otherN,
      }),
    [laborH, materialsN, partsN, otherN],
  );
  const {
    laborTotal: laborSubtotal,
    subtotal: invoiceSubtotal,
    dispatchCredit: deposit,
    amountDue,
  } = billingSnap;
  const { hourlyRateUsd } = billingSnap;

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

  const resetFormForNewReport = useCallback(async () => {
    submittedRef.current = true;
    try {
      await clearEntireServicioDraft();
    } catch {
      /* IDB no disponible o falló: el state local de abajo igual queda en cero */
    }
    try {
      sessionStorage.removeItem(STORAGE_ADMIN);
      sessionStorage.removeItem(STORAGE_CHECKOUT);
      sessionStorage.removeItem(STORAGE_POST_PAY);
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
    skipHydrateBeforeRef.current = false;
    skipHydrateAfterRef.current = false;
    setError(null);
  }, []);

  const handleClearDraft = useCallback(async () => {
    await resetFormForNewReport();
    setStatus(null);
    setChargeError(null);
    setPostCheckoutReady(null);
    setPostCheckoutFailed(false);
  }, [resetFormForNewReport]);

  const runReportPipeline = useCallback(
    async (
      reportId: string,
      stripeSessionId: string | null,
    ): Promise<boolean> => {
      const copy = servicioReportCopy(serviceLanguage);
      setError(null);
      setStatus(null);
      setLoading(true);
      setSubmitStep(copy.stepCalculating);
      try {
        let key = adminKey.trim();
        if (!key) {
          try {
            key = sessionStorage.getItem(STORAGE_ADMIN) ?? "";
          } catch {
            key = "";
          }
        }

        let photosBeforeRefs: UploadedPhotoRef[] = [];
        let photosAfterRefs: UploadedPhotoRef[] = [];
        try {
          setSubmitStep(copy.stepUploading);
          photosBeforeRefs = await uploadPhotoSideDirect(
            "before",
            photosBefore,
            reportId,
            key,
            (p) =>
              setSubmitStep(servicioPhotoProgressLabel(serviceLanguage, p)),
          );
          setSubmitStep(servicioSubmitStepLabel(serviceLanguage, "after"));
          photosAfterRefs = await uploadPhotoSideDirect(
            "after",
            photosAfter,
            reportId,
            key,
            (p) =>
              setSubmitStep(servicioPhotoProgressLabel(serviceLanguage, p)),
          );
        } catch (uploadErr) {
          console.error("[servicio] photo upload failed", uploadErr);
          setError(
            uploadErr instanceof Error ? uploadErr.message : copy.networkError,
          );
          return false;
        }

        setSubmitStep(copy.stepGeneratingReport);
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (key) headers["x-hydronet-admin-key"] = key;
        const body: Record<string, unknown> = {
          reportId,
          serviceLanguage,
          restaurantName,
          bookingReference: bookingReference.trim(),
          clientEmail,
          technicianName,
          serviceDate,
          checklistAirGap: checklist.airGap,
          checklistHandSink: checklist.handSink,
          checklistGreaseTrap: checklist.greaseTrap,
          notes,
          laborHours: laborH,
          materialsSubtotal: materialsN,
          partsSubtotal: partsN,
          otherChargesSubtotal: otherN,
          photosBefore: photosBeforeRefs,
          photosAfter: photosAfterRefs,
        };
        if (stripeSessionId) {
          body.stripeCheckoutSessionId = stripeSessionId;
        }
        let res: Response;
        try {
          res = await fetch("/api/admin/servicio/report", {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          });
        } catch (err) {
          console.error("[servicio] report post failed", err);
          setError(err instanceof Error ? err.message : copy.networkError);
          return false;
        }
        setSubmitStep(copy.stepFinishing);
        let data: { error?: unknown };
        try {
          data = (await res.json()) as { error?: unknown };
        } catch {
          setError(copy.networkError);
          return false;
        }
        if (!res.ok) {
          setError(
            typeof data.error === "string"
              ? data.error
              : JSON.stringify(data.error ?? "Error"),
          );
          return false;
        }
        setStatus(
          buildServicioSuccessMessage(serviceLanguage, clientEmail),
        );
        try {
          sessionStorage.removeItem(STORAGE_CHECKOUT);
          sessionStorage.removeItem(STORAGE_POST_PAY);
        } catch {
          /* ignore */
        }
        setPostCheckoutReady(null);
        setPostCheckoutFailed(false);
        await resetFormForNewReport();
        return true;
      } finally {
        setSubmitStep(null);
        setLoading(false);
      }
    },
    [
      adminKey,
      restaurantName,
      bookingReference,
      clientEmail,
      technicianName,
      serviceDate,
      checklist,
      notes,
      laborH,
      materialsN,
      partsN,
      otherN,
      photosBefore,
      photosAfter,
      serviceLanguage,
      resetFormForNewReport,
    ],
  );

  runReportPipelineRef.current = runReportPipeline;

  useEffect(() => {
    if (!postCheckoutReady) {
      postCheckoutAutorunKeyRef.current = null;
    }
  }, [postCheckoutReady]);

  useEffect(() => {
    if (!draftHydrated) return;
    if (!postCheckoutReady) return;
    const k = `${postCheckoutReady.reportId}:${postCheckoutReady.sessionId}`;
    if (postCheckoutAutorunKeyRef.current === k) return;
    postCheckoutAutorunKeyRef.current = k;
    if (postCheckoutAutorunInFlight) return;
    postCheckoutAutorunInFlight = true;
    setPostCheckoutFailed(false);
    void (async () => {
      try {
        const fn = runReportPipelineRef.current;
        if (!fn) return;
        const ok = await fn(
          postCheckoutReady.reportId,
          postCheckoutReady.sessionId,
        );
        if (!ok) {
          setPostCheckoutFailed(true);
        }
      } finally {
        postCheckoutAutorunInFlight = false;
      }
    })();
  }, [draftHydrated, postCheckoutReady]);

  const onBeforeFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const list = input.files;
    if (!list || list.length === 0) {
      input.value = "";
      return;
    }
    try {
      const files = cloneFilesForState(list);
      if (files.length === 0) return;
      skipHydrateBeforeRef.current = true;
      setPhotosBefore((prev) => [...prev, ...files].slice(0, 6));
    } catch {
      /* ignore: el input se reinicia abajo y el usuario puede reintentar */
    } finally {
      setTimeout(() => {
        try {
          input.value = "";
        } catch {
          /* ignore */
        }
      }, 0);
    }
  };

  const onAfterFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const list = input.files;
    if (!list || list.length === 0) {
      input.value = "";
      return;
    }
    try {
      const files = cloneFilesForState(list);
      if (files.length === 0) return;
      skipHydrateAfterRef.current = true;
      setPhotosAfter((prev) => [...prev, ...files].slice(0, 6));
    } catch {
      /* ignore: el input se reinicia abajo y el usuario puede reintentar */
    } finally {
      setTimeout(() => {
        try {
          input.value = "";
        } catch {
          /* ignore */
        }
      }, 0);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (postCheckoutReady) {
      return;
    }
    setError(null);
    setStatus(null);
    setChargeError(null);
    persistAdminKey();

    let key = adminKey.trim();
    if (!key) {
      try {
        key = sessionStorage.getItem(STORAGE_ADMIN) ?? "";
      } catch {
        key = "";
      }
    }

    if (amountDue > 0) {
      if (amountDue < MIN_CARD_CHARGE_USD) {
        setError(c.chargeMinStripe);
        return;
      }
      setLoading(true);
      setSubmitStep(c.stepCalculating);
      let redirecting = false;
      try {
        await persistFullDraft(buildDraft(), photosBefore, photosAfter);
        const reportId = generateReportId();
        try {
          sessionStorage.setItem(
            STORAGE_CHECKOUT,
            JSON.stringify({ v: 1, reportId, t: Date.now() }),
          );
        } catch {
          /* ignore */
        }
        setSubmitStep(c.stepCharging);
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
          setError(
            typeof data.error === "string" ? data.error : c.chargeError,
          );
          try {
            sessionStorage.removeItem(STORAGE_CHECKOUT);
          } catch {
            /* ignore */
          }
          return;
        }
        if (data.url) {
          redirecting = true;
          window.location.assign(data.url);
          return;
        }
        setError(c.chargeStartError);
        try {
          sessionStorage.removeItem(STORAGE_CHECKOUT);
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.error("[servicio] charge failed", err);
        setError(err instanceof Error ? err.message : c.chargeStartError);
        try {
          sessionStorage.removeItem(STORAGE_CHECKOUT);
        } catch {
          /* ignore */
        }
      } finally {
        if (!redirecting) {
          setSubmitStep(null);
          setLoading(false);
        }
      }
      return;
    }

    const reportId = generateReportId();
    await runReportPipeline(reportId, null);
  }

  async function onRetryPostCheckoutReport() {
    if (!postCheckoutReady) return;
    setPostCheckoutFailed(false);
    setError(null);
    const ok = await runReportPipeline(
      postCheckoutReady.reportId,
      postCheckoutReady.sessionId,
    );
    if (!ok) {
      setPostCheckoutFailed(true);
    }
  }

  const passOpts = [
    { v: "pass" as const, label: c.pass },
    { v: "fail" as const, label: c.fail },
    { v: "na" as const, label: c.na },
  ];

  const primaryLabel =
    amountDue > 0 ? c.submitChargeAndSend : c.submitIdle;

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

      <section className="rounded-2xl border border-slate-600 bg-slate-800/40 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-500/40 bg-slate-900/50 p-3">
            <p className="mb-1 text-sm font-semibold text-sky-300">
              {c.photosBefore}
            </p>
            <p className="mb-1 text-xs text-slate-500">{c.photosBeforeSub}</p>
            <p className="mb-2 text-sm font-medium text-slate-200">
              {c.photoCountInline(photosBefore.length)}
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onBeforeFileInputChange}
              className="mb-2 block w-full max-w-full text-sm text-slate-200 file:mr-2 file:rounded file:border-0 file:bg-sky-700 file:px-2 file:py-1.5"
            />
            <SimplePhotoNameList
              files={photosBefore}
              onRemove={setPhotosBefore}
              removeAria={c.removePhotoAria}
            />
          </div>
          <div className="rounded-xl border border-orange-500/40 bg-slate-900/50 p-3">
            <p className="mb-1 text-sm font-semibold text-orange-300">
              {c.photosAfter}
            </p>
            <p className="mb-1 text-xs text-slate-500">{c.photosAfterSub}</p>
            <p className="mb-2 text-sm font-medium text-slate-200">
              {c.photoCountInline(photosAfter.length)}
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onAfterFileInputChange}
              className="mb-2 block w-full max-w-full text-sm text-slate-200 file:mr-2 file:rounded file:border-0 file:bg-orange-800 file:px-2 file:py-1.5"
            />
            <SimplePhotoNameList
              files={photosAfter}
              onRemove={setPhotosAfter}
              removeAria={c.removePhotoAria}
            />
          </div>
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
              ${hourlyRateUsd.toFixed(2)}
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
          {amountDue > 0 && amountDue < MIN_CARD_CHARGE_USD && (
            <p className="mt-2 text-sm text-amber-200/90">{c.chargeMinStripe}</p>
          )}
          {chargeError && (
            <p className="mt-2 text-sm text-red-300">{chargeError}</p>
          )}
        </div>
      </section>

      {postCheckoutReady && postCheckoutFailed && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3">
          <p className="text-sm text-amber-100">{c.apiGenerateFailed}</p>
          <button
            type="button"
            onClick={() => void onRetryPostCheckoutReport()}
            disabled={loading}
            className="mt-3 w-full rounded-xl border border-amber-400/50 bg-amber-900/40 py-3 text-sm font-semibold text-amber-50 disabled:opacity-50"
          >
            {c.postCheckoutRetry}
          </button>
        </div>
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

      {loading && submitStep ? (
        <p className="text-center text-sm text-slate-300" aria-live="polite">
          {submitStep}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || postCheckoutReady != null}
        className="fixed bottom-0 left-0 right-0 z-10 mx-auto max-w-3xl rounded-t-2xl bg-[#F97316] py-5 text-center text-xl font-bold text-white shadow-[0_-8px_32px_rgba(0,0,0,0.4)] disabled:opacity-60 sm:relative sm:rounded-2xl sm:py-6 sm:shadow-lg"
      >
        {loading
          ? (submitStep ?? c.submitLoading)
          : primaryLabel}
      </button>
    </form>
  );
}

/** Lista mínima: nombre, tamaño legible, quitar. Sin miniaturas. */
function SimplePhotoNameList({
  files,
  onRemove,
  removeAria,
}: {
  files: File[];
  onRemove: React.Dispatch<React.SetStateAction<File[]>>;
  removeAria: string;
}) {
  if (files.length === 0) {
    return <p className="text-xs text-slate-500">(sin archivos)</p>;
  }
  return (
    <ul className="mt-1 space-y-1.5 text-xs text-slate-300">
      {files.map((f, i) => (
        <li
          key={`${f.name}-${i}-${f.size}-${f.lastModified}`}
          className="flex items-start justify-between gap-2"
        >
          <span className="min-w-0 break-all">
            <span className="text-slate-200">{f.name}</span>{" "}
            <span className="text-slate-500">
              ({formatFileSize(f.size)}
              {f.type ? ` · ${f.type}` : null})
            </span>
          </span>
          <button
            type="button"
            onClick={() => onRemove((prev) => prev.filter((_, j) => j !== i))}
            className="shrink-0 touch-manipulation rounded px-1.5 text-sm text-red-300 hover:bg-red-950/50"
            aria-label={removeAria}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
