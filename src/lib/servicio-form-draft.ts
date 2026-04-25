/**
 * Borrador del formulario /admin/servicio: texto en localStorage, fotos en IndexedDB
 * (File no es serializable a JSON; conserva bytes para re-envío y preview).
 */

const LS_KEY = "hydronet_servicio_draft_v1";
const IDB_NAME = "hydronet-servicio-draft";
const IDB_VERSION = 1;
const PHOTO_STORE = "photoSides";

export type ServicioDraftV1 = {
  v: 1;
  serviceLanguage: "en" | "es";
  adminKey: string;
  restaurantName: string;
  bookingReference: string;
  clientEmail: string;
  technicianName: string;
  serviceDate: string;
  checklist: { airGap: string; handSink: string; greaseTrap: string };
  notes: string;
  laborHours: string;
  materialsSubtotal: string;
  partsSubtotal: string;
  otherChargesSubtotal: string;
};

type IdbFileRow = { name: string; type: string; lastModified: number; data: ArrayBuffer };

function inferTypeForRestoredFile(name: string, stored: string): string {
  const t = stored?.trim();
  if (t && t !== "application/octet-stream") return t;
  const lower = name.toLowerCase();
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (/\.(jpe?g)$/i.test(name)) return "image/jpeg";
  return "image/jpeg";
}

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE);
      }
    };
  });
}

function idbGet(db: IDBDatabase, key: "before" | "after"): Promise<IdbFileRow[] | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readonly");
    const st = tx.objectStore(PHOTO_STORE);
    const r = st.get(key);
    r.onsuccess = () => resolve(r.result as IdbFileRow[] | undefined);
    r.onerror = () => reject(r.error);
  });
}

function idbPut(
  db: IDBDatabase,
  key: "before" | "after",
  rows: IdbFileRow[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    const st = tx.objectStore(PHOTO_STORE);
    st.put(rows, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbClearStore(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    const st = tx.objectStore(PHOTO_STORE);
    st.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function filesToRows(files: File[]): Promise<IdbFileRow[]> {
  return Promise.all(
    files.map(
      (f) =>
        new Promise<IdbFileRow>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => {
            const data = r.result;
            if (data instanceof ArrayBuffer) {
              resolve({
                name: f.name,
                type: f.type || inferTypeForRestoredFile(f.name, f.type),
                lastModified: f.lastModified,
                data,
              });
            } else {
              reject(new Error("readAsArrayBuffer expected"));
            }
          };
          r.onerror = () => reject(r.error);
          r.readAsArrayBuffer(f);
        }),
    ),
  );
}

function rowsToFiles(rows: IdbFileRow[]): File[] {
  return rows.map((r) => {
    const t = inferTypeForRestoredFile(r.name, r.type);
    return new File([r.data], r.name, { type: t, lastModified: r.lastModified });
  });
}

export function loadDraftFromLocalStorage(): Partial<ServicioDraftV1> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object" || (p as ServicioDraftV1).v !== 1) {
      return null;
    }
    return p as Partial<ServicioDraftV1>;
  } catch {
    return null;
  }
}

export function saveDraftToLocalStorage(draft: ServicioDraftV1): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode */
  }
}

export function clearDraftLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

export async function savePhotoSide(
  side: "before" | "after",
  files: File[],
): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  if (files.length === 0) {
    const db = await idbOpen();
    await idbPut(db, side, []);
    db.close();
    return;
  }
  const rows = await filesToRows(files);
  const db = await idbOpen();
  await idbPut(db, side, rows);
  db.close();
}

export async function loadPhotoSide(side: "before" | "after"): Promise<File[]> {
  if (typeof indexedDB === "undefined") return [];
  let db: IDBDatabase;
  try {
    db = await idbOpen();
  } catch {
    return [];
  }
  try {
    const rows = (await idbGet(db, side)) ?? [];
    return rowsToFiles(rows);
  } catch {
    return [];
  } finally {
    try {
      db.close();
    } catch {
      /* ignore */
    }
  }
}

export async function clearAllDraftPhotos(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await idbOpen();
    await idbClearStore(db);
    db.close();
  } catch {
    /* ignore */
  }
}

/** Persist texto + ambos lados de fotos (p. ej. antes de redirigir a Stripe). */
export async function persistFullDraft(
  draft: ServicioDraftV1,
  photosBefore: File[],
  photosAfter: File[],
): Promise<void> {
  saveDraftToLocalStorage(draft);
  try {
    await savePhotoSide("before", photosBefore);
  } catch {
    /* idb lleno o no disponible: el otro lado sigue en try aparte */
  }
  try {
    await savePhotoSide("after", photosAfter);
  } catch {
    /* idb: evita que falle un lado y deje de persistir el otro */
  }
}

export async function clearEntireServicioDraft(): Promise<void> {
  clearDraftLocalStorage();
  await clearAllDraftPhotos();
}
