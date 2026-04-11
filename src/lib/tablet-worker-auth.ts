/**
 * IDs de trabajador para abrir fichas en tablet sin clave admin.
 * En .env: TABLET_WORKER_IDS=HN-001,HN-002 (coma, sin espacios obligatorios).
 */
export function parseTabletWorkerIds(): string[] {
  const raw = process.env.TABLET_WORKER_IDS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type TabletAuthResult =
  | { ok: true; mode: "admin" | "worker" | "open" }
  | { ok: false };

/**
 * - admin: clave ADMIN_SERVICIO_KEY correcta.
 * - worker: TABLET_WORKER_IDS definido y x-hydronet-worker-id coincide.
 * - open: sin ADMIN_SERVICIO_KEY ni lista de trabajadores (solo desarrollo / conf. abierta).
 */
export function authorizeTabletRequest(req: Request): TabletAuthResult {
  const adminKey = process.env.ADMIN_SERVICIO_KEY;
  const workers = parseTabletWorkerIds();
  const hAdmin = req.headers.get("x-hydronet-admin-key");
  const hWorker = req.headers.get("x-hydronet-worker-id")?.trim() ?? "";

  if (adminKey && hAdmin === adminKey) {
    return { ok: true, mode: "admin" };
  }

  if (workers.length > 0) {
    const w = hWorker.toLowerCase();
    const match = workers.some((id) => id.toLowerCase() === w);
    if (match && hWorker.length > 0) {
      return { ok: true, mode: "worker" };
    }
  }

  if (!adminKey && workers.length === 0) {
    return { ok: true, mode: "open" };
  }

  return { ok: false };
}
