"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";

type Row =
  | {
      kind: "link";
      id: string;
      href: string;
      label: string;
      k: string;
    }
  | {
      kind: "action";
      id: string;
      label: string;
      k: string;
      run: () => void | Promise<void>;
    };

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function CommandMenu() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const rows: Row[] = useMemo(
    () => [
      {
        kind: "link",
        id: "home",
        href: "/",
        label: t("commandMenu.home"),
        k: "home inicio start",
      },
      {
        kind: "link",
        id: "book",
        href: "/book",
        label: t("commandMenu.book"),
        k: "book reserva cita appointment schedule",
      },
      {
        kind: "link",
        id: "bookGold",
        href: "/book/gold",
        label: t("commandMenu.bookGold"),
        k: "gold member membresía",
      },
      {
        kind: "link",
        id: "login",
        href: "/login",
        label: t("commandMenu.login"),
        k: "login sign in acceso",
      },
      {
        kind: "link",
        id: "register",
        href: "/register",
        label: t("commandMenu.register"),
        k: "register cuenta account",
      },
      {
        kind: "link",
        id: "dashboard",
        href: "/dashboard",
        label: t("commandMenu.dashboard"),
        k: "dashboard panel gold",
      },
      {
        kind: "link",
        id: "tablet",
        href: "/admin/servicio",
        label: t("commandMenu.tablet"),
        k: "tablet servicio admin field técnico",
      },
      {
        kind: "link",
        id: "jobcard",
        href: "/admin/cita",
        label: t("commandMenu.jobCard"),
        k: "job card ficha cita tablet obra verification",
      },
      {
        kind: "link",
        id: "terms",
        href: "/terms",
        label: t("commandMenu.terms"),
        k: "terms legal",
      },
      {
        kind: "link",
        id: "refunds",
        href: "/refunds",
        label: t("commandMenu.refunds"),
        k: "refunds cancelaciones reembolso",
      },
      {
        kind: "link",
        id: "privacy",
        href: "/privacy",
        label: t("commandMenu.privacy"),
        k: "privacy privacidad",
      },
      {
        kind: "action",
        id: "lang-en",
        label: t("commandMenu.langEn"),
        k: "english english idioma language",
        run: () => setLocale("en"),
      },
      {
        kind: "action",
        id: "lang-es",
        label: t("commandMenu.langEs"),
        k: "español spanish idioma",
        run: () => setLocale("es"),
      },
    ],
    [t, setLocale],
  );

  const filtered = useMemo(() => {
    const s = normalize(q);
    if (!s) return rows;
    return rows.filter(
      (r) =>
        normalize(r.label).includes(s) ||
        normalize(r.k).includes(s) ||
        normalize(r.id).includes(s),
    );
  }, [rows, q]);

  const filteredRef = useRef(filtered);
  filteredRef.current = filtered;
  const selectedRef = useRef(0);
  selectedRef.current = selected;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [q, open]);

  useEffect(() => {
    setSelected((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  const toggle = useCallback(() => {
    setOpen((o) => !o);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggle]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ("");
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = "hidden";
      return () => cancelAnimationFrame(id);
    }
    document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const activate = useCallback(
    (idx: number) => {
      const row = filteredRef.current[idx];
      if (!row) return;
      if (row.kind === "action") {
        if (row.id === "lang-en" && locale === "en") return;
        if (row.id === "lang-es" && locale === "es") return;
      }
      setOpen(false);
      if (row.kind === "link") {
        router.push(row.href);
        return;
      }
      void row.run();
    },
    [locale, router],
  );

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-cmd-idx="${selected}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [selected, open]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const len = filteredRef.current.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => Math.min(i + 1, len - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(selectedRef.current);
    }
  };

  const panel = open && mounted && (
    <div
      className="command-menu-overlay fixed inset-0 z-[100] flex items-start justify-center bg-black/55 p-4 pt-[max(2rem,8vh)] backdrop-blur-sm animate-command-menu-fade-in"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        className="command-menu-panel w-full max-w-lg overflow-hidden rounded-2xl border border-slate-600/80 bg-slate-900/95 shadow-2xl shadow-black/50 animate-command-menu-slide-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-menu-title"
      >
        <div className="border-b border-slate-700/80 px-4 py-3">
          <h2
            id="command-menu-title"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400/90"
          >
            {t("commandMenu.title")}
          </h2>
          <div className="mt-2 flex gap-2">
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={t("commandMenu.placeholder")}
              className="input-field mt-0 flex-1"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {t("commandMenu.hintClose")}
            <span className="mx-1">·</span>
            <kbd className="rounded border border-slate-600 bg-slate-800 px-1 font-mono text-[10px] text-slate-400">
              ⌘K
            </kbd>
            <span className="mx-0.5">/</span>
            <kbd className="rounded border border-slate-600 bg-slate-800 px-1 font-mono text-[10px] text-slate-400">
              Ctrl+K
            </kbd>
          </p>
        </div>
        <ul
          ref={listRef}
          tabIndex={-1}
          className="max-h-[min(52vh,420px)] overflow-y-auto overflow-x-hidden py-2"
          role="listbox"
          aria-label={t("commandMenu.title")}
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              {t("commandMenu.empty")}
            </li>
          ) : (
            filtered.map((row, idx) => {
              const active = idx === selected;
              const base =
                "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm transition outline-none";
              const cls = active
                ? `${base} bg-sky-500/15 text-sky-100 ring-1 ring-inset ring-sky-500/50`
                : `${base} text-slate-200 hover:bg-slate-800/80`;

              if (row.kind === "link") {
                return (
                  <li key={row.id} role="presentation" data-cmd-idx={idx}>
                    <Link
                      href={row.href}
                      className={cls}
                      role="option"
                      aria-selected={active}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setSelected(idx)}
                    >
                      <span className="font-mono text-[10px] text-slate-500">
                        ↗
                      </span>
                      <span>{row.label}</span>
                    </Link>
                  </li>
                );
              }

              const disabled =
                (row.id === "lang-en" && locale === "en") ||
                (row.id === "lang-es" && locale === "es");

              return (
                <li key={row.id} role="presentation" data-cmd-idx={idx}>
                  <button
                    type="button"
                    disabled={disabled}
                    className={`${cls} disabled:cursor-not-allowed disabled:opacity-40`}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setSelected(idx)}
                    onClick={() => {
                      if (!disabled) activate(idx);
                    }}
                  >
                    <span className="font-mono text-[10px] text-slate-500">
                      ◌
                    </span>
                    <span>{row.label}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800/70 px-px py-2 text-xs font-medium text-slate-400 transition hover:border-slate-500 hover:text-slate-200 sm:px-2"
        aria-label={t("commandMenu.triggerAria")}
        title={t("commandMenu.triggerTitle")}
      >
        <span className="hidden sm:inline font-mono text-[10px] text-slate-500">
          ⌘K
        </span>
        <svg
          className="h-4 w-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
