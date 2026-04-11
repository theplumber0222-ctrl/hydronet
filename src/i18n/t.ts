import type { Messages } from "@/i18n/messages/types";

/** Dot-path lookup: "home.hero.title" */
export function t(messages: Messages, path: string): string {
  const keys = path.split(".");
  let cur: unknown = messages;
  for (const k of keys) {
    if (cur === null || cur === undefined) return path;
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === "string" ? cur : path;
}
