/**
 * Validación de contacto para reservas (cliente + API).
 * No sustituye verificación por SMS/correo; evita basura obvia en BD.
 */

/** Formato de correo con dominio y TLD ≥ 2 caracteres (no "a@b.c"). */
const EMAIL_FORMAT =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

export function isValidEmailFormat(email: string): boolean {
  const t = email.trim();
  if (t.length < 5 || t.length > 254) return false;
  if (t.includes("..") || t.startsWith(".") || t.includes("@.")) return false;
  if (!EMAIL_FORMAT.test(t)) return false;
  const domain = t.split("@")[1] ?? "";
  if (!domain.includes(".")) return false;
  const tld = domain.split(".").pop() ?? "";
  return tld.length >= 2;
}

/** Normaliza a 10 dígitos NANP (EE. UU.); descarta +1 inicial. */
export function normalizeUsPhoneDigits(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d;
}

/** Teléfono EE. UU. válido: exactamente 10 dígitos; código de área no empieza en 0 ni 1. */
export function isValidUsPhone(input: string): boolean {
  const d = normalizeUsPhoneDigits(input);
  if (d.length !== 10) return false;
  if (d[0] === "0" || d[0] === "1") return false;
  return true;
}

/** Dirección escrita a mano (sin Google): longitud mínima razonable. */
export const MIN_ADDRESS_LINE_LENGTH_FALLBACK = 12;

export function isValidFallbackAddressLine(line: string): boolean {
  return line.trim().length >= MIN_ADDRESS_LINE_LENGTH_FALLBACK;
}

/** Google Place ID suele ser largo (p. ej. ChIJ…). */
export function isValidGooglePlaceId(placeId: string): boolean {
  const p = placeId.trim();
  return p.length >= 8;
}
