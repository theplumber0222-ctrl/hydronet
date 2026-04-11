import { randomInt } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código de 8 caracteres para abrir la ficha en tablet (sin O/0/I/1). */
export function generateTabletCode(): string {
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

/** Normaliza entrada (mayúsculas, sin espacios ni guiones). */
export function normalizeTabletQuery(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}
