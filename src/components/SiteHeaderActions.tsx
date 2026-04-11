"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";
import { CommandMenu } from "@/components/CommandMenu";

export function SiteHeaderActions() {
  const { t } = useI18n();

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <CommandMenu />
      <Link
        href="/book"
        className="btn-primary inline-flex min-h-[44px] items-center justify-center px-4 text-sm font-semibold sm:px-5 sm:text-base"
      >
        {t("home.ctaBook")}
      </Link>
    </div>
  );
}
