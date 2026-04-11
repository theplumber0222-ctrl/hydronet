import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { getDictionary, getLocale } from "@/i18n/server";
import { t } from "@/i18n/t";

export default async function LoginPage() {
  const d = getDictionary(await getLocale());

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-bold text-white">{t(d, "login.title")}</h1>
      <p className="mt-2 text-sm text-slate-400">{t(d, "login.subtitle")}</p>
      <Suspense fallback={<p className="mt-8 text-slate-500">{t(d, "book.loading")}</p>}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-slate-400">
        {t(d, "login.noAccount")}{" "}
        <Link href="/register" className="link-sky">
          {t(d, "login.register")}
        </Link>
      </p>
      <p className="mt-4 text-center">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
          {t(d, "login.back")}
        </Link>
      </p>
    </main>
  );
}
