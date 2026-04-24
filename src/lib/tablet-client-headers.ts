"use client";

const STORAGE_ADMIN = "hydronet_servicio_admin_key";
const STORAGE_WORKER = "hydronet_worker_id";

/**
 * Cabeceras para APIs de tableta (worker ID + admin key opcional).
 * Solo usar en el cliente (sessionStorage).
 */
export function buildTabletFetchHeaders(
  locale: string,
  workerId: string,
  adminKey: string,
): HeadersInit {
  const headers: HeadersInit = {
    "x-hydronet-lang": locale,
  };
  let w = workerId.trim();
  let key = adminKey.trim();
  if (!w || !key) {
    try {
      if (!w) w = sessionStorage.getItem(STORAGE_WORKER) ?? "";
      if (!key) key = sessionStorage.getItem(STORAGE_ADMIN) ?? "";
    } catch {
      /* ignore */
    }
  }
  if (w) headers["x-hydronet-worker-id"] = w;
  if (key) headers["x-hydronet-admin-key"] = key;
  return headers;
}

export { STORAGE_ADMIN, STORAGE_WORKER };
