"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ESTIMATE_RETENTION_DAYS } from "@/lib/estimate-constants";
import type { EstimateLineItem } from "@/lib/estimate-line-items";

const STORAGE_ADMIN = "hydronet_servicio_admin_key";
const STORAGE_WORKER = "hydronet_worker_id";

type EstimateListRow = {
  id: string;
  restaurantName: string;
  email: string;
  phone: string | null;
  addressLine: string | null;
  lineItems: unknown;
  totalCents: number;
  notes: string | null;
  status: "DRAFT" | "ACTIVE" | "CONVERTED" | "EXPIRED";
  expiresAt: string;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function parseLineItems(raw: unknown): EstimateLineItem[] {
  if (!Array.isArray(raw)) return [];
  const out: EstimateLineItem[] = [];
  for (const x of raw) {
    if (
      x &&
      typeof x === "object" &&
      "description" in x &&
      "amountCents" in x &&
      typeof (x as { description: unknown }).description === "string" &&
      typeof (x as { amountCents: unknown }).amountCents === "number"
    ) {
      out.push({
        description: (x as { description: string }).description,
        amountCents: (x as { amountCents: number }).amountCents,
      });
    }
  }
  return out;
}

function usdFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function EstimadosTabletView() {
  const { t, locale } = useI18n();
  const [workerId, setWorkerId] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [estimates, setEstimates] = useState<EstimateListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<{ description: string; amountUsd: string }[]>(
    [{ description: "", amountUsd: "" }],
  );

  const [openId, setOpenId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

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

  const buildHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
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

  const loadList = useCallback(async () => {
    setListLoading(true);
    setError(null);
    persistKey();
    persistWorker();
    try {
      const res = await fetch("/api/admin/estimates", { headers: buildHeaders() });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 401
            ? t("tabletCita.unauthorized")
            : t("tabletCita.networkError"),
        );
        return;
      }
      if (Array.isArray(data?.estimates)) {
        setEstimates(data.estimates as EstimateListRow[]);
      }
    } catch {
      setError(t("tabletCita.networkError"));
    } finally {
      setListLoading(false);
    }
  }, [buildHeaders, persistKey, persistWorker, t]);

  useEffect(() => {
    void loadList();
    // Intentionally once on mount; headers fall back to sessionStorage if fields are empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addLine() {
    setLines((prev) => [...prev, { description: "", amountUsd: "" }]);
  }

  function updateLine(
    i: number,
    patch: Partial<{ description: string; amountUsd: string }>,
  ) {
    setLines((prev) =>
      prev.map((row, j) => (j === i ? { ...row, ...patch } : row)),
    );
  }

  function removeLine(i: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatusMsg(null);
    persistKey();
    persistWorker();

    const lineItems: EstimateLineItem[] = [];
    for (const row of lines) {
      const desc = row.description.trim();
      const n = parseFloat(row.amountUsd.replace(",", "."));
      if (!desc && (!n || n <= 0)) continue;
      if (!desc) {
        setError(t("adminEstimados.errLineDesc"));
        return;
      }
      if (Number.isNaN(n) || n <= 0) {
        setError(t("adminEstimados.errLineAmount"));
        return;
      }
      lineItems.push({
        description: desc,
        amountCents: Math.round(n * 100),
      });
    }

    if (lineItems.length === 0) {
      setError(t("adminEstimados.errNoLines"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/estimates", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          addressLine: addressLine.trim() || null,
          lineItems,
          notes: notes.trim() || null,
          status: "ACTIVE",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : t("tabletCita.networkError"),
        );
        return;
      }
      setStatusMsg(t("adminEstimados.successCreate"));
      setRestaurantName("");
      setEmail("");
      setPhone("");
      setAddressLine("");
      setNotes("");
      setLines([{ description: "", amountUsd: "" }]);
      await loadList();
      if (data?.estimate?.id) setOpenId(data.estimate.id);
    } catch {
      setError(t("tabletCita.networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function onConvert(id: string) {
    setConvertingId(id);
    setError(null);
    persistKey();
    persistWorker();
    try {
      const res = await fetch(`/api/admin/estimates/${id}/convert`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 410) setError(t("adminEstimados.errExpired"));
        else if (res.status === 409) setError(t("adminEstimados.errAlready"));
        else if (res.status === 401) setError(t("tabletCita.unauthorized"));
        else
          setError(
            typeof data.error === "string"
              ? data.error
              : t("adminEstimados.errConvert"),
          );
        return;
      }
      setStatusMsg(t("adminEstimados.successConvert"));
      await loadList();
      setOpenId(id);
    } catch {
      setError(t("tabletCita.networkError"));
    } finally {
      setConvertingId(null);
    }
  }

  const localeTag = locale === "es" ? "es-US" : "en-US";

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
            href="/admin/historial"
            className="text-sm text-sky-400 hover:underline"
          >
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
          {t("adminEstimados.pageTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {t("adminEstimados.pageSubtitle")}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {t("adminEstimados.retentionNote").replace(
            "{{days}}",
            String(ESTIMATE_RETENTION_DAYS),
          )}
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

      <section className="rounded-xl border border-slate-600 bg-slate-800/40 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-400/90">
          {t("adminEstimados.createTitle")}
        </h2>
        <form onSubmit={onCreate} className="mt-4 space-y-4">
          <div>
            <label className="label">{t("adminEstimados.restaurantLabel")}</label>
            <input
              className="input-field mt-1"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">{t("adminEstimados.emailLabel")}</label>
            <input
              className="input-field mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">{t("adminEstimados.phoneLabel")}</label>
            <input
              className="input-field mt-1"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t("adminEstimados.addressLabel")}</label>
            <input
              className="input-field mt-1"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
            />
          </div>

          <div>
            <p className="label">{t("adminEstimados.lineItemsTitle")}</p>
            <div className="mt-2 space-y-2">
              {lines.map((row, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 rounded-lg border border-slate-700/80 p-3 sm:flex-row sm:items-end"
                >
                  <div className="min-w-0 flex-1">
                    <label className="text-xs text-slate-500">
                      {t("adminEstimados.lineDesc")}
                    </label>
                    <input
                      className="input-field mt-1"
                      value={row.description}
                      onChange={(e) =>
                        updateLine(i, { description: e.target.value })
                      }
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="text-xs text-slate-500">
                      {t("adminEstimados.lineAmount")}
                    </label>
                    <input
                      className="input-field mt-1"
                      inputMode="decimal"
                      value={row.amountUsd}
                      onChange={(e) =>
                        updateLine(i, { amountUsd: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-400 hover:border-slate-500"
                      onClick={() => removeLine(i)}
                    >
                      {t("adminEstimados.removeLine")}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-2 text-sm text-sky-400 hover:underline"
              onClick={addLine}
            >
              {t("adminEstimados.addLine")}
            </button>
          </div>

          <div>
            <label className="label">{t("adminEstimados.notesLabel")}</label>
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary min-h-[48px] w-full disabled:opacity-50"
          >
            {loading ? "…" : t("adminEstimados.createButton")}
          </button>
        </form>
      </section>

      {error && (
        <p className="rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      {statusMsg && (
        <p className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100">
          {statusMsg}
        </p>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-400/90">
            {t("adminEstimados.listTitle")}
          </h2>
          <button
            type="button"
            onClick={() => void loadList()}
            disabled={listLoading}
            className="text-sm text-sky-400 hover:underline disabled:opacity-50"
          >
            {listLoading ? "…" : t("adminEstimados.refreshList")}
          </button>
        </div>

        {estimates.length === 0 && !listLoading ? (
          <p className="text-sm text-slate-500">{t("adminEstimados.emptyList")}</p>
        ) : null}

        <ul className="space-y-2">
          {estimates.map((est) => {
            const expired = new Date(est.expiresAt) < new Date();
            const canConvert =
              !expired &&
              (est.status === "ACTIVE" || est.status === "DRAFT");
            const open = openId === est.id;
            const items = parseLineItems(est.lineItems);
            return (
              <li
                key={est.id}
                className="rounded-xl border border-slate-600 bg-slate-900/40"
              >
                <button
                  type="button"
                  className="flex w-full flex-col gap-1 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
                  onClick={() => setOpenId(open ? null : est.id)}
                >
                  <span className="font-medium text-slate-100">
                    {est.restaurantName}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    ${usdFromCents(est.totalCents)} · {est.status}
                    {expired ? ` · ${t("adminEstimados.expiredBadge")}` : null}
                  </span>
                </button>
                {open && (
                  <div className="space-y-3 border-t border-slate-700 px-4 pb-4 pt-3 text-sm text-slate-300">
                    <p className="font-mono text-xs text-slate-500">{est.id}</p>
                    <p>
                      {est.email}
                      {est.phone ? ` · ${est.phone}` : ""}
                    </p>
                    {est.addressLine ? <p>{est.addressLine}</p> : null}
                    <p className="text-xs text-slate-500">
                      {t("adminEstimados.expiresLabel")}:{" "}
                      {new Date(est.expiresAt).toLocaleString(localeTag, {
                        timeZone: "America/Chicago",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {est.notes ? (
                      <p className="whitespace-pre-wrap text-slate-400">
                        {est.notes}
                      </p>
                    ) : null}
                    <ul className="space-y-1 border-l border-slate-600 pl-3">
                      {items.map((it, i) => (
                        <li key={i}>
                          {it.description} — ${usdFromCents(it.amountCents)}
                        </li>
                      ))}
                    </ul>
                    {est.status === "CONVERTED" ? (
                      <p className="text-emerald-400">{t("adminEstimados.converted")}</p>
                    ) : null}
                    {canConvert ? (
                      <button
                        type="button"
                        disabled={convertingId === est.id}
                        onClick={() => void onConvert(est.id)}
                        className="btn-primary min-h-[44px] w-full sm:w-auto"
                      >
                        {convertingId === est.id
                          ? "…"
                          : t("adminEstimados.convertButton")}
                      </button>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
