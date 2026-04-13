"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useI18n } from "@/contexts/I18nContext";
import { AddressFieldPlaces } from "@/components/AddressFieldPlaces";
import { useGoogleMapsKeyAvailable } from "@/hooks/useGoogleMapsKeyAvailable";
import {
  isValidEmailFormat,
  isValidFallbackAddressLine,
  isValidUsPhone,
} from "@/lib/contact-validation";
import { CheckoutCancelPlansLink } from "@/components/CheckoutCancelPlansLink";

type GoldBilling = "annual" | "monthly";

export function GoldMembershipJoinForm({
  defaultBilling,
}: {
  defaultBilling: GoldBilling;
}) {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const [goldBilling, setGoldBilling] = useState<GoldBilling>(defaultBilling);
  const [restaurantName, setRestaurantName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [terms, setTerms] = useState(false);
  const [commitmentTerms, setCommitmentTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [addressEverBlurred, setAddressEverBlurred] = useState(false);
  const [addressSubmitAttempted, setAddressSubmitAttempted] = useState(false);

  useEffect(() => {
    const u = session?.user?.email;
    if (u) {
      setEmail((prev) => prev || u);
    }
  }, [session?.user?.email]);

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

  const setAddress = (line: string, pid: string) => {
    setAddressLine(line);
    setPlaceId(pid);
  };

  const canSubmit = useMemo(() => {
    const commitmentOk =
      goldBilling === "annual" || commitmentTerms === true;
    return (
      terms &&
      commitmentOk &&
      restaurantName.trim().length >= 2 &&
      addressValid &&
      emailValid &&
      phoneValid
    );
  }, [
    terms,
    goldBilling,
    commitmentTerms,
    restaurantName,
    addressValid,
    emailValid,
    phoneValid,
  ]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddressSubmitAttempted(true);
    setError(null);
    if (!terms) {
      setError(t("joinGold.errTerms"));
      return;
    }
    if (goldBilling === "monthly" && !commitmentTerms) {
      setError(t("joinGold.errCommitment"));
      return;
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
    if (!emailValid) {
      setError(t("booking.errEmail"));
      return;
    }
    if (!phoneValid) {
      setError(t("booking.errPhone"));
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        serviceType: "GOLD_MEMBERSHIP",
        goldBilling,
        restaurantName: restaurantName.trim(),
        addressLine: addressLine.trim(),
        placeId: placeId || undefined,
        phone: phone.trim(),
        email: email.trim(),
        termsAccepted: true,
        locale,
        cancelReturn: "joinGold",
        commitmentTermsAccepted:
          goldBilling === "monthly" ? true : undefined,
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
        <button
          type="button"
          onClick={() => setGoldBilling("annual")}
          className={`flex-1 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
            goldBilling === "annual"
              ? "border-orange-500 bg-orange-950/40 text-orange-100 ring-2 ring-orange-500/40"
              : "border-slate-600 text-slate-400 hover:border-slate-500"
          }`}
        >
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            {t("joinGold.pickAnnual")}
          </span>
          <span className="mt-1 block text-lg text-white">
            {t("pricing.goldAnnualAmount")} {t("pricing.goldPerYear")}
          </span>
          <span className="mt-0.5 block text-xs font-normal text-slate-400">
            {t("joinGold.onePayment")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setGoldBilling("monthly")}
          className={`flex-1 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
            goldBilling === "monthly"
              ? "border-orange-500 bg-orange-950/40 text-orange-100 ring-2 ring-orange-500/40"
              : "border-slate-600 text-slate-400 hover:border-slate-500"
          }`}
        >
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            {t("joinGold.pickMonthly")}
          </span>
          <span className="mt-1 block text-lg text-white">
            {t("pricing.goldMonthlyAmount")}
            <span className="text-base font-normal text-slate-400">
              {" "}
              {t("pricing.goldMonthlyNote")}
            </span>
          </span>
        </button>
      </div>

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

      {goldBilling === "monthly" && (
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={commitmentTerms}
            onChange={(e) => setCommitmentTerms(e.target.checked)}
            className="mt-1"
          />
          <span className="leading-relaxed">{t("stripeUi.commitmentMonthly")}</span>
        </label>
      )}

      <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="mt-1"
        />
        <span>
          {locale === "es" ? (
            <>
              Acepto los{" "}
              <Link href="/terms" className="link-sky font-medium">
                Términos de servicio
              </Link>{" "}
              y la política de la membresía Gold.
            </>
          ) : (
            <>
              I accept the{" "}
              <Link href="/terms" className="link-sky font-medium">
                Terms of Service
              </Link>{" "}
              and Gold membership terms.
            </>
          )}
        </span>
      </label>

      {error && (
        <p className="rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="btn-primary w-full min-h-[52px] disabled:opacity-50"
      >
        {loading
          ? t("booking.submitting")
          : goldBilling === "annual"
            ? t("joinGold.ctaPayAnnual")
            : t("joinGold.ctaPayMonthly")}
      </button>
      <CheckoutCancelPlansLink />
    </form>
  );
}
