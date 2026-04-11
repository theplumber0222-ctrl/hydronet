/**
 * Datos públicos del negocio para páginas legales y pie de página.
 * No incluir aquí secretos; solo nombres y área ya usados en el sitio.
 */

export const LEGAL_ENTITY_NAME = "HydroNet LLC";

/** Marca principal (alineada a metadata y JsonLd). */
export const BRAND_SERVICE_NAME = "HydroNet Plumbing";

/** Nombre corto usado en páginas legales (cabecera) y referencias internas. */
export const BRAND_CONNECT_NAME = "HydroNet Plumbing";

export function getPublicContactEmail(): string {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@hydronet.live";
}

export function getPublicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://hydronet.live";
}

/**
 * TODO único (operador): completar cuando exista dirección y teléfono comercial oficiales.
 * No dispersar otros TODO; enlazar a este archivo desde textos legales si hace falta.
 */
export const OPERATOR_TODO_CONTACT_DETAILS_ES =
  "Dirección física comercial y teléfono de atención: pendientes de publicar en este sitio. Mientras tanto, use el correo indicado más abajo.";
