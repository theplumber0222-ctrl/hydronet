"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acceptedLegal) {
      setError(t("register.errLegal"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : t("api.registerFail"),
        );
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError(t("register.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-bold text-white">{t("register.title")}</h1>
      <p className="mt-2 text-sm text-slate-400">{t("register.subtitle")}</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label">{t("register.name")}</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t("register.email")}</label>
          <input
            className="input-field"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t("register.password")}</label>
          <input
            className="input-field"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={acceptedLegal}
            onChange={(e) => setAcceptedLegal(e.target.checked)}
            className="mt-1"
          />
          <span>
            {t("register.legalIntro")}{" "}
            <Link href="/terms" className="link-sky font-medium">
              {t("register.termsLink")}
            </Link>{" "}
            {t("register.legalConnector")}{" "}
            <Link href="/privacy" className="link-sky font-medium">
              {t("register.privacyLink")}
            </Link>
            .
          </span>
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t("register.submitting") : t("register.submit")}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        {t("register.hasAccount")}{" "}
        <Link href="/login" className="link-sky">
          {t("register.signIn")}
        </Link>
      </p>
    </main>
  );
}
