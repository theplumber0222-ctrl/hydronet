"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(t("login.error"));
      return;
    }
    await router.refresh();
    await router.push(callbackUrl);
  }

  return (
    <>
      {registered === "1" && (
        <p className="rounded-md bg-sky-950/50 px-3 py-2 text-sm text-sky-300">
          {t("login.registered")}
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label">{t("login.email")}</label>
          <input
            className="input-field"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t("login.password")}</label>
          <input
            className="input-field"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t("login.submitting") : t("login.submit")}
        </button>
      </form>
    </>
  );
}
