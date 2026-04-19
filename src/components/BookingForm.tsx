"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ServiceType } from "@prisma/client";
import { useI18n } from "@/contexts/I18nContext";
import { AddressFieldPlaces } from "@/components/AddressFieldPlaces";
import { CheckoutCancelPlansLink } from "@/components/CheckoutCancelPlansLink";
import { useGoogleMapsKeyAvailable } from "@/hooks/useGoogleMapsKeyAvailable";
import {
  getHourlyPlumbingCheckoutBreakdown,
  getPublicCheckoutBreakdown,
} from "@/lib/booking-pricing";
import {
  getDateMismatchCode,
  isWeekdayTN,
} from "@/lib/calendar-rules";
import {
  isValidEmailFormat,
  isValidFallbackAddressLine,
  isValidUsPhone,
} from "@/lib/contact-validation";
const CATALOG_IDS = [
  "drainage",
  "water_heater",
  "fixtures",
  "inspection",
] as const;

type CatalogId = (typeof CATALOG_IDS)[number];

function BookingFormSkeleton() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-4 rounded-lg border border-slate-700 bg-slate-900/30 p-6">
      <div className="h-4 w-3/4 rounded bg-slate-700" />
      <div className="h-10 rounded bg-slate-700" />
      <div className="h-10 rounded bg-slate-700" />
    </div>
  );
}

function BookingFormFields() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const hourlyFromUrl =
    searchParams.get("hourly") === "1" ||
    searchParams.get("hourly") === "true";
  const jettingFromUrl =
    searchParams.get("jetting") === "1" ||
    searchParams.get("jetting") === "true";

  const { data: session } = useSession();
  const [billingMode, setBillingMode] = useState<"standard" | "hourly">(
    () => (hourlyFromUrl ? "hourly" : "standard"),
  );
  const [catalogId, setCatalogId] = useState<CatalogId>("drainage");
  const [restaurantName, setRestaurantName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [billingContactName, setBillingContactName] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [siteContactName, setSiteContactName] = useState("");
  const [siteContactPhone, setSiteContactPhone] = useState("");
  const [spendLimitDollars, setSpendLimitDollars] = useState("");
  const [approvalOverLimitNote, setApprovalOverLimitNote] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [addressEverBlurred, setAddressEverBlurred] = useState(false);
  const [addressSubmitAttempted, setAddressSubmitAttempted] = useState(false);
  /** Socio Gold activo: este formulario público no debe cobrar el Dispatch fee — usar /book/gold */
  const [activeGoldBlocksPublicBook, setActiveGoldBlocksPublicBook] =
    useState(false);

  useEffect(() => {
    fetch("/api/membership/summary")
      .then((r) => r.json())
      .then((d: { gold?: { active?: boolean } | null }) => {
        setActiveGoldBlocksPublicBook(d.gold?.active === true);
      })
      .catch(() => {});
  }, []);

  const serviceOptions = useMemo(
    () =>
      CATALOG_IDS.map((id) => ({
        id,
        label: t(`booking.services.${id}.label`),
        hint: t(`booking.services.${id}.hint`),
      })),
    [t],
  );

  const hourlyLabel = t("booking.hourlyServiceName");

  useEffect(() => {
    if (hourlyFromUrl) setBillingMode("hourly");
  }, [hourlyFromUrl]);

  useEffect(() => {
    if (jettingFromUrl) {
      setBillingMode("standard");
      setCatalogId("drainage");
    }
  }, [jettingFromUrl]);

  const scheduledIsoForPreview = useMemo(() => {
    if (!scheduledAt) return null;
    try {
      return new Date(scheduledAt).toISOString();
    } catch {
      return null;
    }
  }, [scheduledAt]);

  const serviceType: ServiceType = useMemo(() => {
    if (billingMode === "hourly") return "HOURLY_PLUMBING";
    if (!scheduledIsoForPreview) return "CONNECT_STANDARD";
    return isWeekdayTN(scheduledIsoForPreview)
      ? "CONNECT_STANDARD"
      : "EMERGENCY";
  }, [billingMode, scheduledIsoForPreview]);

  const selectedOption = serviceOptions.find((o) => o.id === catalogId)!;
  const selectedServiceLabel = selectedOption.label;

  useEffect(() => {
    const u = session?.user?.email;
    if (u) {
      setEmail((prev) => prev || u);
      setInvoiceEmail((prev) => prev || u);
    }
  }, [session?.user?.email]);

  const dateMismatchMessage = useMemo(() => {
    if (!scheduledIsoForPreview) return null;
    const code = getDateMismatchCode(serviceType, scheduledIsoForPreview);
    if (!code) return null;
    if (code === "WEEKDAY_ONLY") return t("booking.dateMismatchWeekday");
    if (code === "EMERGENCY_WEEKEND_ONLY") {
      return t("booking.dateMismatchWeekendNonMember");
    }
    return t("booking.dateMismatchWeekendGold");
  }, [scheduledIsoForPreview, serviceType, t]);

  const hasGoogleMapsKey = useGoogleMapsKeyAvailable();
  const addressValid = hasGoogleMapsKey
    ? Boolean(placeId?.trim())
    : isValidFallbackAddressLine(addressLine);
  const addressNeedsPlaceSelection =
    hasGoogleMapsKey && !!addressLine.trim() && !placeId?.trim();
  const showAddressPlacesError =
    addressNeedsPlaceSelection &&
    (addressSubmitAttempted || (!addressFocused && addressEverBlurred));

  const emailValid = isValidEmailFormat(email);
  const phoneValid = isValidUsPhone(phone);
  const invoiceEmailValid = isValidEmailFormat(invoiceEmail);
  const sitePhoneValid = isValidUsPhone(siteContactPhone);

  const spendLimitParsed = useMemo(() => {
    const s = spendLimitDollars.trim();
    if (!s) return { cents: null as number | null, valid: true };
    const n = parseFloat(s.replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) return { cents: -1, valid: false };
    return { cents: Math.round(n * 100), valid: true };
  }, [spendLimitDollars]);

  const contactFieldsOk =
    restaurantName.trim().length >= 2 && addressValid && emailValid && phoneValid;

  const verificationOk =
    workDescription.trim().length >= 10 &&
    billingContactName.trim().length >= 2 &&
    invoiceEmailValid &&
    siteContactName.trim().length >= 2 &&
    sitePhoneValid &&
    spendLimitParsed.valid &&
    (spendLimitParsed.cents == null ||
      spendLimitParsed.cents <= 0 ||
      approvalOverLimitNote.trim().length >= 5);

  const canProceedToPayment =
    terms &&
    contactFieldsOk &&
    verificationOk &&
    !dateMismatchMessage &&
    !!scheduledAt &&
    !activeGoldBlocksPublicBook;

  // Build a human-readable list of missing fields so the user knows why the
  // pay button is disabled. Without this hint the button just looks "broken".
  const missingFieldHints = useMemo(() => {
    const out: string[] = [];
    if (!restaurantName.trim() || restaurantName.trim().length < 2) {
      out.push(t("booking.businessName"));
    }
    if (!addressValid) out.push(t("booking.address"));
    if (!emailValid) out.push(t("booking.email"));
    if (!phoneValid) out.push(t("booking.phone"));
    if (!scheduledAt) out.push(t("booking.datetime"));
    if (workDescription.trim().length < 10) {
      out.push(t("verify.workDescription"));
    }
    if (billingContactName.trim().length < 2) {
      out.push(t("verify.billingContactName"));
    }
    if (!invoiceEmailValid) out.push(t("verify.invoiceEmail"));
    if (siteContactName.trim().length < 2) {
      out.push(t("verify.siteContactName"));
    }
    if (!sitePhoneValid) out.push(t("verify.siteContactPhone"));
    if (!terms) out.push(t("booking.termsCheckbox"));
    return out;
  }, [
    addressValid,
    billingContactName,
    emailValid,
    invoiceEmailValid,
    phoneValid,
    restaurantName,
    scheduledAt,
    siteContactName,
    sitePhoneValid,
    t,
    terms,
    workDescription,
  ]);

  const pricePreview = useMemo(() => {
    if (!scheduledIsoForPreview || dateMismatchMessage) return null;
    if (billingMode === "hourly") {
      return {
        mode: "hourly" as const,
        label: hourlyLabel,
        ...getHourlyPlumbingCheckoutBreakdown(),
      };
    }
    const st = isWeekdayTN(scheduledIsoForPreview)
      ? "CONNECT_STANDARD"
      : "EMERGENCY";
    const pub = getPublicCheckoutBreakdown(st);
    return {
      mode: "standard" as const,
      label: selectedServiceLabel,
      rateBand: st === "CONNECT_STANDARD" ? ("weekday" as const) : ("weekend" as const),
      ...pub,
    };
  }, [
    scheduledIsoForPreview,
    dateMismatchMessage,
    billingMode,
    selectedServiceLabel,
    hourlyLabel,
  ]);

  const setAddress = (line: string, pid: string) => {
    setAddressLine(line);
    setPlaceId(pid);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddressSubmitAttempted(true);
    setError(null);
    if (!terms) {
      setError(t("booking.errTerms"));
      return;
    }
    if (scheduledAt) {
      const iso = new Date(scheduledAt).toISOString();
      const mismatch = getDateMismatchCode(serviceType, iso);
      if (mismatch) {
        setError(
          mismatch === "WEEKDAY_ONLY"
            ? t("booking.dateMismatchWeekday")
            : mismatch === "EMERGENCY_WEEKEND_ONLY"
              ? t("booking.dateMismatchWeekendNonMember")
              : t("booking.dateMismatchWeekendGold"),
        );
        return;
      }
    }
    if (restaurantName.trim().length < 2) {
      setError(t("booking.errBusinessName"));
      return;
    }
    if (hasGoogleMapsKey && !placeId?.trim()) {
      setError(t("booking.errPlaces"));
      return;
    }
    if (!hasGoogleMapsKey && !isValidFallbackAddressLine(addressLine)) {
      setError(t("booking.errAddressLen"));
      return;
    }
    if (!isValidEmailFormat(email)) {
      setError(t("booking.errEmail"));
      return;
    }
    if (!isValidUsPhone(phone)) {
      setError(t("booking.errPhone"));
      return;
    }
    if (!scheduledAt) {
      setError(t("booking.errDatetime"));
      return;
    }

    const scheduledIso = new Date(scheduledAt).toISOString();

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        serviceType,
        serviceCatalogLine:
          billingMode === "hourly" ? hourlyLabel : selectedServiceLabel,
        restaurantName,
        addressLine,
        placeId: placeId || undefined,
        phone,
        email,
        scheduledAt: scheduledIso,
        termsAccepted: true,
        locale,
        workDescription: workDescription.trim(),
        billingContactName: billingContactName.trim(),
        invoiceEmail: invoiceEmail.trim(),
        siteContactName: siteContactName.trim(),
        siteContactPhone: siteContactPhone.trim(),
        spendLimitCents:
          spendLimitParsed.cents != null && spendLimitParsed.cents > 0
            ? spendLimitParsed.cents
            : null,
        approvalOverLimitNote: approvalOverLimitNote.trim() || undefined,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error),
        );
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
      }
    } catch {
      setError(t("booking.errNetwork"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="mx-auto max-w-lg space-y-5">
      <p className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-400">
        <strong className="text-slate-300">HydroNet Plumbing</strong>{" "}
        — {t("booking.brandBlurb")}{" "}
        <abbr title="International Plumbing Code" className="no-underline">
          IPC 2018
        </abbr>
        . {t("stripeUi.slaNote")}
      </p>

      {activeGoldBlocksPublicBook && (
        <div className="rounded-lg border border-amber-600/50 bg-amber-950/35 p-4 text-sm leading-relaxed text-amber-100/95">
          <p>{t("booking.goldMemberBanner")}</p>
          <Link
            href="/book/gold"
            className="mt-2 inline-block font-semibold text-sky-300 underline decoration-sky-500/60 underline-offset-2 hover:text-sky-200"
          >
            {t("booking.goldMemberBannerCta")}
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {t("booking.billingMode")}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBillingMode("standard")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              billingMode === "standard"
                ? "border-sky-500 bg-sky-950/50 text-sky-200"
                : "border-slate-600 text-slate-400 hover:border-slate-500"
            }`}
          >
            {t("booking.standardAppt")}
          </button>
          <button
            type="button"
            onClick={() => setBillingMode("hourly")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              billingMode === "hourly"
                ? "border-orange-500 bg-orange-950/40 text-orange-200"
                : "border-slate-600 text-slate-400 hover:border-slate-500"
            }`}
          >
            {t("booking.hourlyRate")}
          </button>
        </div>
      </div>

      {billingMode === "standard" && (
        <div>
          <label className="label">{t("booking.serviceLabel")}</label>
          <select
            className="input-field"
            value={catalogId}
            onChange={(e) => setCatalogId(e.target.value as CatalogId)}
          >
            {serviceOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">{selectedOption.hint}</p>
        </div>
      )}

      {billingMode === "hourly" && (
        <div className="rounded-xl border border-orange-800/40 bg-orange-950/15 p-4">
          <p className="text-sm font-semibold text-orange-200">{hourlyLabel}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {t("booking.hourlyBox")}
          </p>
        </div>
      )}

      <div>
        <label className="label">{t("booking.businessName")}</label>
        <input
          className="input-field"
          required
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
        />
      </div>

      <div>
        <label className="label">{t("booking.address")}</label>
        <AddressFieldPlaces
          value={addressLine}
          onChange={setAddress}
          disabled={loading}
          showSelectionRequired={showAddressPlacesError}
          onFocus={() => setAddressFocused(true)}
          onBlur={() => {
            setAddressFocused(false);
            setAddressEverBlurred(true);
          }}
        />
      </div>

      <div>
        <label className="label">{t("booking.phone")}</label>
        <input
          className={`input-field ${phone.trim() && !phoneValid ? "border-amber-600/80 ring-1 ring-amber-600/30" : ""}`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          placeholder="(931) 555-0100"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={phone.trim() !== "" && !phoneValid ? true : undefined}
        />
        {phone.trim() !== "" && !phoneValid && (
          <p className="mt-1 text-xs text-amber-300">{t("booking.phoneHint")}</p>
        )}
      </div>

      <div>
        <label className="label">{t("booking.email")}</label>
        <input
          className={`input-field ${email.trim() && !emailValid ? "border-amber-600/80 ring-1 ring-amber-600/30" : ""}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@yourbusiness.com"
          aria-invalid={email.trim() !== "" && !emailValid ? true : undefined}
        />
        {email.trim() !== "" && !emailValid && (
          <p className="mt-1 text-xs text-amber-300">{t("booking.emailHint")}</p>
        )}
      </div>

      <div className="rounded-xl border border-sky-800/40 bg-slate-900/40 p-4">
        <p className="text-sm font-semibold text-sky-300">{t("verify.title")}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {t("verify.intro")}
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">{t("verify.workDescription")}</label>
            <textarea
              className="input-field min-h-[88px] resize-y"
              required
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              rows={3}
            />
            <p className="mt-1 text-xs text-slate-500">
              {t("verify.workDescriptionHint")}
            </p>
          </div>
          <div>
            <label className="label">{t("verify.billingContactName")}</label>
            <input
              className="input-field"
              required
              value={billingContactName}
              onChange={(e) => setBillingContactName(e.target.value)}
            />
          </div>
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <label className="label mb-0 flex-1">
                {t("verify.invoiceEmail")}
              </label>
              <button
                type="button"
                className="text-xs font-medium text-sky-400 underline-offset-2 hover:underline"
                onClick={() => setInvoiceEmail(email)}
              >
                {t("verify.copyInvoiceEmail")}
              </button>
            </div>
            <input
              className={`input-field ${invoiceEmail.trim() && !invoiceEmailValid ? "border-amber-600/80 ring-1 ring-amber-600/30" : ""}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={invoiceEmail}
              onChange={(e) => setInvoiceEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t("verify.siteContactName")}</label>
            <input
              className="input-field"
              required
              value={siteContactName}
              onChange={(e) => setSiteContactName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t("verify.siteContactPhone")}</label>
            <input
              className={`input-field ${siteContactPhone.trim() && !sitePhoneValid ? "border-amber-600/80 ring-1 ring-amber-600/30" : ""}`}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              required
              value={siteContactPhone}
              onChange={(e) => setSiteContactPhone(e.target.value)}
            />
            {siteContactPhone.trim() !== "" && !sitePhoneValid && (
              <p className="mt-1 text-xs text-amber-300">{t("booking.phoneHint")}</p>
            )}
          </div>
          <div>
            <label className="label">{t("verify.spendLimitLabel")}</label>
            <input
              className={`input-field ${spendLimitDollars.trim() && !spendLimitParsed.valid ? "border-amber-600/80 ring-1 ring-amber-600/30" : ""}`}
              type="text"
              inputMode="decimal"
              placeholder="500"
              value={spendLimitDollars}
              onChange={(e) => setSpendLimitDollars(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">{t("verify.spendLimitHint")}</p>
            {spendLimitDollars.trim() !== "" && !spendLimitParsed.valid && (
              <p className="mt-1 text-xs text-amber-300">{t("booking.errSpendLimit")}</p>
            )}
          </div>
          {(spendLimitParsed.cents ?? 0) > 0 && (
            <div>
              <label className="label">{t("verify.approvalOverLimitLabel")}</label>
              <textarea
                className="input-field min-h-[72px] resize-y"
                required
                value={approvalOverLimitNote}
                onChange={(e) => setApprovalOverLimitNote(e.target.value)}
                rows={2}
              />
              <p className="mt-1 text-xs text-slate-500">
                {t("verify.approvalOverLimitHint")}
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="label">{t("booking.datetime")}</label>
        <input
          className="input-field"
          type="datetime-local"
          required
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-400">
          {billingMode === "hourly"
            ? t("booking.datetimeHintHourly")
            : t("booking.datetimeHintSingleVisit")}
        </p>
        {dateMismatchMessage && (
          <p className="mt-2 text-sm font-medium text-red-400">
            {dateMismatchMessage}
          </p>
        )}
      </div>

      {pricePreview && (
        <div className="rounded-xl border border-sky-700/50 bg-sky-950/25 p-4">
          <p className="text-sm font-semibold text-sky-300">
            {t("booking.chargeSummary")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {t("booking.serviceLine")}{" "}
            <strong className="text-slate-300">{pricePreview.label}</strong>
          </p>
          {pricePreview.mode === "hourly" ? (
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>
                {t("booking.hourlyRateLine")}{" "}
                <strong className="text-white">
                  ${pricePreview.serviceTotalUsd.toFixed(2)}
                </strong>
              </p>
              <p className="font-semibold text-sky-200">
                {t("booking.chargeToday")}
                {pricePreview.totalChargeUsd.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">{t("booking.ipcNote")}</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>
                {t("booking.standardTotal")}{" "}
                <strong className="text-white">
                  ${pricePreview.serviceTotalUsd.toFixed(2)}
                </strong>{" "}
                (
                {pricePreview.rateBand === "weekday"
                  ? t("booking.rateBandWeekday")
                  : t("booking.rateBandWeekend")}
                )
              </p>
              <p>
                {t("booking.reserveToday")}{" "}
                <strong className="text-white">
                  ${pricePreview.depositUsd.toFixed(2)}
                </strong>
                {" — "}
                {t("booking.balanceDue")}{" "}
                <strong className="text-white">
                  ${pricePreview.balancePendingUsd.toFixed(2)}
                </strong>
              </p>
              <p className="font-semibold text-sky-200">
                {t("booking.chargeToday")}
                {pricePreview.totalChargeUsd.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
        <div
          className={`space-y-2 text-xs leading-relaxed ${
            billingMode === "hourly"
              ? "border-b border-orange-800/30 pb-4 text-slate-400"
              : "border-b border-slate-600/80 pb-4 text-slate-400"
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              billingMode === "hourly"
                ? "text-orange-200/95"
                : "text-sky-300"
            }`}
          >
            {t("stripeUi.flatFeeTitle")}
          </p>
          <p>{t("stripeUi.dispatchFeePurpose")}</p>
          {billingMode === "hourly" ? (
            <>
              <p>{t("stripeUi.hourlyFlatFeeBlurb")}</p>
              <p className="text-slate-500">{t("booking.hourlyAdditionalAfterFirst")}</p>
            </>
          ) : (
            <p>{t("stripeUi.flatFeeBlurb")}</p>
          )}
          <p className="text-slate-500">{t("stripeUi.depositLegal")}</p>
          {billingMode === "standard" && (
            <p>{t("booking.depositNoteStandard")}</p>
          )}
          <p className="font-medium text-amber-200/95">
            {t("booking.dispatchNoShowPolicy")}
          </p>
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1"
          />
          <span>
            {locale === "es" ? (
              <>
                Acepto el Dispatch fee ($195) y la logística indicadas arriba,
                los{" "}
                <Link href="/terms" className="link-sky font-medium">
                  Términos de servicio
                </Link>{" "}
                y la{" "}
                <Link href="/refunds" className="link-sky font-medium">
                  política de cancelaciones y reembolsos
                </Link>
                , así como las condiciones del servicio seleccionado. La
                cancelación requiere al menos 24 horas de anticipación.
              </>
            ) : (
              <>
                I accept the Dispatch fee ($195) and logistics described above,
                the{" "}
                <Link href="/terms" className="link-sky font-medium">
                  Terms of Service
                </Link>
                , and the{" "}
                <Link href="/refunds" className="link-sky font-medium">
                  Cancellations & refunds
                </Link>{" "}
                policy, as well as the conditions for the selected service.
                Cancellation requires at least 24 hours notice.
              </>
            )}
          </span>
        </label>
      </div>

      {error && (
        <p className="rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {!canProceedToPayment && missingFieldHints.length > 0 && (
        <div className="rounded-md border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
          <p className="font-medium">
            {locale === "es"
              ? "Falta completar para continuar:"
              : "To continue, please complete:"}
          </p>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {missingFieldHints.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !canProceedToPayment}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t("booking.submitting") : t("booking.submitPayServiceFee")}
      </button>
      <CheckoutCancelPlansLink />
    </form>
  );
}

export function BookingForm() {
  return (
    <Suspense fallback={<BookingFormSkeleton />}>
      <BookingFormFields />
    </Suspense>
  );
}
