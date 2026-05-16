export const CATALOG_STORAGE_KEY = "archive-rvw-catalog";
export const CATALOG_UPDATE_EVENT = "archive-rvw-catalog-updated";

export type CatalogEntry = {
  title: string;
  materialType: string;
  fabricContents: string;
  color: string;
  size: string;
  /** Full image URL */
  imageUrl: string;
};

export function emptyEntry(): CatalogEntry {
  return {
    title: "",
    materialType: "",
    fabricContents: "",
    color: "",
    size: "",
    imageUrl: "",
  };
}

export function loadCatalog(): Record<number, CatalogEntry> {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<CatalogEntry>>;
    const out: Record<number, CatalogEntry> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = Number(k);
      if (!Number.isFinite(id) || id < 0) continue;
      out[id] = { ...emptyEntry(), ...v };
    }
    return out;
  } catch {
    return {};
  }
}

function persist(catalog: Record<number, CatalogEntry>): void {
  const serial: Record<string, CatalogEntry> = {};
  for (const [k, v] of Object.entries(catalog)) {
    serial[String(k)] = v;
  }
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(serial));
  window.dispatchEvent(new Event(CATALOG_UPDATE_EVENT));
}

export function upsertCatalogEntry(
  id: number,
  patch: Partial<CatalogEntry>
): CatalogEntry {
  const all = loadCatalog();
  const next = { ...emptyEntry(), ...all[id], ...patch };
  all[id] = next;
  persist(all);
  return next;
}

export function deleteCatalogEntry(id: number): void {
  const all = loadCatalog();
  delete all[id];
  persist(all);
}

export function catalogEntryIsEmpty(e: CatalogEntry): boolean {
  return (
    !e.title.trim() &&
    !e.materialType.trim() &&
    !e.fabricContents.trim() &&
    !e.color.trim() &&
    !e.size.trim() &&
    !e.imageUrl.trim()
  );
}

/** Saved slots that have an image — used for the home grid (no empty placeholders). */
export function listCatalogPieceIds(
  catalog: Record<number, CatalogEntry>
): number[] {
  return Object.keys(catalog)
    .map((k) => Number(k))
    .filter((id) => Number.isFinite(id) && id >= 0)
    .filter((id) => {
      const e = catalog[id];
      return e != null && !catalogEntryIsEmpty(e) && e.imageUrl.trim().length > 0;
    })
    .sort((a, b) => a - b);
}
