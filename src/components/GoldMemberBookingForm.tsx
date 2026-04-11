"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ServiceType } from "@prisma/client";
import { useI18n } from "@/contexts/I18nContext";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import {
  getGoldMemberCheckoutBreakdown,
  getGoldWeekendEmergencyDepositBreakdown,
  type GoldMembershipSummary,
} from "@/lib/booking-pricing";
import { getDateMismatchCode } from "@/lib/calendar-rules";
import {
  isValidEmailFormat,
  isValidFallbackAddressLine,
  isValidUsPhone,
} from "@/lib/contact-validation";
import { getPublicGoogleMapsApiKey } from "@/lib/google-maps-env";

type VisitMode = "preventive" | "extra" | "weekend";

function GoldMemberBookingFormSkeleton() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-4 rounded-lg border border-slate-700 bg-slate-900/30 p-6">
      <div className="h-4 w-3/4 rounded bg-slate-700" />
      <div className="h-10 rounded bg-slate-700" />
    </div>
  );
}

function GoldMemberBookingFormInner() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();

  const [gold, setGold] = useState<GoldMembershipSummary | null | undefined>(
    undefined,
  );
  const [visitMode, setVisitMode] = useState<VisitMode>("preventive");
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

  useEffect(() => {
    const kind = searchParams.get("kind");
    if (kind === "extra") setVisitMode("extra");
    else if (kind === "weekend") setVisitMode("weekend");
    else setVisitMode("preventive");
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/membership/summary");
        const data = await res.json();
        if (cancelled) return;
        if (data?.gold?.active) {
          setGold(data.gold);
        } else {
          setGold(null);
        }
      } catch {
        if (!cancelled) setGold(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const u = session?.user?.email;
    if (u) {
      setEmail((prev) => prev || u);
      setInvoiceEmail((prev) => prev || u);
    }
  }, [session?.user?.email]);

  const serviceType: ServiceType = useMemo(() => {
    if (visitMode === "weekend") return "GOLD_WEEKEND_EMERGENCY";
    if (visitMode === "extra") return "GOLD_EXTRA";
    return "GOLD_SCHEDULED";
  }, [visitMode]);

  const scheduledIsoForPreview = useMemo(() => {
    if (!scheduledAt) return null;
    try {
      return new Date(scheduledAt).toISOString();
    } catch {
      return null;
    }
  }, [scheduledAt]);

  const dateMismatchMessage = useMemo(() => {
    if (!scheduledIsoForPreview) return null;
    const code = getDateMismatchCode(serviceType, scheduledIsoForPreview);
    if (!code) return null;
    return code === "WEEKDAY_ONLY"
      ? t("booking.dateMismatchWeekday")
      : t("booking.dateMismatchWeekendGold");
  }, [scheduledIsoForPreview, serviceType, t]);

  const hasGoogleMapsKey = !!getPublicGoogleMapsApiKey();
  const addressValid = hasGoogleMapsKey
    ? Boolean(placeId?.trim())
    : isValidFallbackAddressLine(addressLine);
  const addressSelectionMissing =
    hasGoogleMapsKey && !!addressLine.trim() && !placeId?.trim();

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

  const includedExhausted = Boolean(
    gold &&
      gold.visitsUsed >= gold.visitsIncluded &&
      visitMode === "preventive",
  );

  const canProceedToPayment =
    !!gold &&
    terms &&
    contactFieldsOk &&
    verificationOk &&
    !dateMismatchMessage &&
    !!scheduledAt &&
    !includedExhausted;

  const pricePreview = useMemo(() => {
    if (!gold || !scheduledIsoForPreview || dateMismatchMessage) return null;
    if (
      visitMode === "preventive" &&
      gold.visitsUsed >= gold.visitsIncluded
    ) {
      return null;
    }
    if (visitMode === "weekend") {
      return {
        mode: "weekend" as const,
        ...getGoldWeekendEmergencyDepositBreakdown(),
      };
    }
    if (visitMode === "extra") {
      return {
        mode: "goldExtra" as const,
        ...getGoldMemberCheckoutBreakdown({
          active: true,
          visitsUsed: gold.visitsIncluded,
          visitsIncluded: gold.visitsIncluded,
        }),
      };
    }
    return {
      mode: "goldPreventive" as const,
      ...getGoldMemberCheckoutBreakdown(gold),
    };
  }, [gold, scheduledIsoForPreview, dateMismatchMessage, visitMode]);

  const setAddress = (line: string, pid: string) => {
    setAddressLine(line);
    setPlaceId(pid);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!gold) {
      setError(t("bookGold.errNoMembership"));
      return;
    }
    if (includedExhausted) {
      setError(t("bookGold.errIncludedExhausted"));
      return;
    }
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
        serviceCatalogLine: t("bookGold.serviceCatalogDrain"),
        restaurantName,
        addressLine,
        placeId: placeId || undefined,
        phone,
        email,
        scheduledAt: scheduledIso,
        termsAccepted: true,
        locale,
        cancelReturn: "bookGold",
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

  if (sessionStatus === "loading" || gold === undefined) {
    return <GoldMemberBookingFormSkeleton />;
  }

  if (!session?.user) {
    return (
      <p className="text-slate-400">
        <Link href="/login?callbackUrl=/book/gold" className="link-sky">
          {t("bookGold.signIn")}
        </Link>
      </p>
    );
  }

  if (gold === null) {
    return (
      <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-4 text-sm text-amber-100">
        <p>{t("bookGold.noMembership")}</p>
        <Link href="/book" className="mt-2 inline-block link-sky">
          {t("bookGold.viewPlans")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-5">
      <p className="rounded-lg border border-orange-700/40 bg-orange-950/20 p-3 text-sm text-slate-300">
        {t("bookGold.intro")}
      </p>

      <p className="text-sm text-slate-400">
        {t("bookGold.visitsSummary")
          .replace("{used}", String(gold.visitsUsed))
          .replace("{included}", String(gold.visitsIncluded))}
      </p>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {t("bookGold.visitTypeLabel")}
        </legend>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-600 bg-slate-900/40 p-3 text-sm">
            <input
              type="radio"
              name="visitMode"
              checked={visitMode === "preventive"}
              onChange={() => setVisitMode("preventive")}
              className="mt-1"
            />
            <span>
              <strong className="text-slate-200">
                {t("bookGold.modePreventiveTitle")}
              </strong>
              <span className="mt-1 block text-slate-400">
                {t("bookGold.modePreventiveDesc")}
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-600 bg-slate-900/40 p-3 text-sm">
            <input
              type="radio"
              name="visitMode"
              checked={visitMode === "extra"}
              onChange={() => setVisitMode("extra")}
              className="mt-1"
            />
            <span>
              <strong className="text-slate-200">
                {t("bookGold.modeExtraTitle")}
              </strong>
              <span className="mt-1 block text-slate-400">
                {t("bookGold.modeExtraDesc")}
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-600 bg-slate-900/40 p-3 text-sm">
            <input
              type="radio"
              name="visitMode"
              checked={visitMode === "weekend"}
              onChange={() => setVisitMode("weekend")}
              className="mt-1"
            />
            <span>
              <strong className="text-slate-200">
                {t("bookGold.modeWeekendTitle")}
              </strong>
              <span className="mt-1 block text-slate-400">
                {t("bookGold.modeWeekendDesc")}
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {includedExhausted && (
        <p className="rounded-md bg-amber-950/50 px-3 py-2 text-sm text-amber-200">
          {t("bookGold.errIncludedExhausted")}
        </p>
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
        <AddressAutocomplete
          value={addressLine}
          onChange={setAddress}
          disabled={loading}
          showSelectionRequired={addressSelectionMissing}
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
          {visitMode === "weekend"
            ? t("bookGold.datetimeHintWeekend")
            : t("bookGold.datetimeHintWeekday")}
        </p>
        {dateMismatchMessage && (
          <p className="mt-2 text-sm font-medium text-red-400">
            {dateMismatchMessage}
          </p>
        )}
      </div>

      {pricePreview && (
        <div className="rounded-xl border border-orange-700/50 bg-orange-950/20 p-4">
          <p className="text-sm font-semibold text-orange-200">
            {t("booking.chargeSummary")}
          </p>
          {pricePreview.mode === "weekend" ? (
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              {pricePreview.lines.map((line) => (
                <p key={line.label}>
                  {line.label}:{" "}
                  <strong className="text-white">
                    ${line.amountUsd.toFixed(2)}
                  </strong>
                </p>
              ))}
              <p className="font-semibold text-orange-200">
                {t("booking.chargeToday")}
                {pricePreview.totalChargeUsd.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">
                {t("bookGold.weekendPayNote")}
              </p>
            </div>
          ) : pricePreview.mode === "goldExtra" ? (
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              {pricePreview.lines.map((line) => (
                <p key={line.label}>
                  {line.label}:{" "}
                  <strong className="text-white">
                    ${line.amountUsd.toFixed(2)}
                  </strong>
                </p>
              ))}
              <p className="font-semibold text-orange-200">
                {t("booking.chargeToday")}
                {pricePreview.totalChargeUsd.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">
                {t("bookGold.depositNoteExtra")}
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              {pricePreview.tier === "included" ? (
                <>
                  {pricePreview.lines.map((line) => (
                    <p key={line.label}>
                      {line.label}:{" "}
                      <strong className="text-white">
                        ${line.amountUsd.toFixed(2)}
                      </strong>
                    </p>
                  ))}
                  <p className="font-semibold text-orange-200">
                    {t("booking.chargeToday")}
                    {pricePreview.totalChargeUsd.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t("bookGold.depositNoteIncluded")}
                  </p>
                </>
              ) : (
                <>
                  {pricePreview.lines.map((line) => (
                    <p key={line.label}>
                      {line.label}:{" "}
                      <strong className="text-white">
                        ${line.amountUsd.toFixed(2)}
                      </strong>
                    </p>
                  ))}
                  <p className="font-semibold text-orange-200">
                    {t("booking.chargeToday")}
                    {pricePreview.totalChargeUsd.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t("bookGold.depositNoteExtra")}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
        <p className="text-sm font-medium text-orange-300/95">
          {t("bookGold.termsLead")}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {t("bookGold.memberNoDepositLegal")}
        </p>
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1"
          />
          <span>
            {locale === "es" ? (
              <>
                Acepto las condiciones anteriores, los{" "}
                <Link href="/terms" className="link-sky font-medium">
                  Términos de servicio
                </Link>{" "}
                y la{" "}
                <Link href="/refunds" className="link-sky font-medium">
                  política de cancelaciones y reembolsos
                </Link>
                . La cancelación requiere al menos 24 horas de anticipación.
              </>
            ) : (
              <>
                I accept the terms above, the{" "}
                <Link href="/terms" className="link-sky font-medium">
                  Terms of Service
                </Link>
                , and the{" "}
                <Link href="/refunds" className="link-sky font-medium">
                  Cancellations & refunds
                </Link>{" "}
                policy. Cancellation requires at least 24 hours notice.
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

      <button
        type="submit"
        disabled={loading || !canProceedToPayment}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading
          ? t("booking.submitting")
          : pricePreview?.mode === "goldPreventive" &&
              pricePreview.totalChargeUsd === 0
            ? t("bookGold.submitIncluded")
            : t("booking.submitPay")}
      </button>
    </form>
  );
}

export function GoldMemberBookingForm() {
  return (
    <Suspense fallback={<GoldMemberBookingFormSkeleton />}>
      <GoldMemberBookingFormInner />
    </Suspense>
  );
}
