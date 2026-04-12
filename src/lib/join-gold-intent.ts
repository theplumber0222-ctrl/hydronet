/**
 * Build /register link for Gold join flow from a login callbackUrl pointing at /join/gold.
 */
export function registerHrefFromJoinGoldCallback(
  callbackUrl: string | undefined,
): string {
  if (!callbackUrl?.trim()) return "/register";
  let raw = callbackUrl.trim();
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* use as-is */
  }
  let path = raw;
  try {
    if (raw.includes("://")) {
      const u = new URL(raw);
      path = `${u.pathname}${u.search}`;
    }
  } catch {
    /* relative path */
  }
  if (!path.startsWith("/join/gold")) return "/register";
  try {
    const u = new URL(path, "http://local.invalid");
    const billing =
      u.searchParams.get("billing") === "monthly" ? "monthly" : "annual";
    return `/register?plan=gold&billing=${billing}`;
  } catch {
    return "/register?plan=gold&billing=annual";
  }
}
