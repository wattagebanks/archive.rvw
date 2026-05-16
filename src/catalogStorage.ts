export const CATALOG_STORAGE_KEY = "archive-rvw-catalog";
export const CATALOG_UPDATE_EVENT = "archive-rvw-catalog-updated";

export type CatalogEntry = {
  title: string;
  materialType: string;
  fabricContents: string;
  color: string;
  size: string;
  /** Full image URL; empty uses Picsum with imageSeed */
  imageUrl: string;
  /** Passed to picsum /seed/ when imageUrl is empty */
  imageSeed: string;
};

export function emptyEntry(): CatalogEntry {
  return {
    title: "",
    materialType: "",
    fabricContents: "",
    color: "",
    size: "",
    imageUrl: "",
    imageSeed: "",
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
    !e.imageUrl.trim() &&
    !e.imageSeed.trim()
  );
}
