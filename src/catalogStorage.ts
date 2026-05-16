export const CATALOG_STORAGE_KEY = "archive-rvw-catalog";
export const CATALOG_UPDATE_EVENT = "archive-rvw-catalog-updated";

export type CatalogEntry = {
  sku: string;
  title: string;
  color: string;
  shell: string;
  lining: string;
  customFit: string;
  dateMade: string;
  year: string;
  collection: string;
  price: string;
  showPrice: boolean;
  /** Full image URL */
  imageUrl: string;
};

export function emptyEntry(): CatalogEntry {
  return {
    sku: "",
    title: "",
    color: "",
    shell: "",
    lining: "",
    customFit: "",
    dateMade: "",
    year: "",
    collection: "",
    price: "",
    showPrice: false,
    imageUrl: "",
  };
}

type LegacyCatalogFields = {
  materialType?: string;
  fabricContents?: string;
  size?: string;
};

function normalizeEntry(
  raw: Partial<CatalogEntry> & LegacyCatalogFields
): CatalogEntry {
  const shell =
    raw.shell?.trim() ||
    raw.fabricContents?.trim() ||
    raw.materialType?.trim() ||
    "";
  const customFit = raw.customFit?.trim() || raw.size?.trim() || "";
  return {
    sku: raw.sku?.trim() ?? "",
    title: raw.title?.trim() ?? "",
    color: raw.color?.trim() ?? "",
    shell,
    lining: raw.lining?.trim() ?? "",
    customFit,
    dateMade: raw.dateMade?.trim() ?? "",
    year: raw.year?.trim() ?? "",
    collection: raw.collection?.trim() ?? "",
    price: raw.price?.trim() ?? "",
    showPrice: Boolean(raw.showPrice),
    imageUrl: raw.imageUrl?.trim() ?? "",
  };
}

export function loadCatalog(): Record<number, CatalogEntry> {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<
      string,
      Partial<CatalogEntry> & LegacyCatalogFields
    >;
    const out: Record<number, CatalogEntry> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = Number(k);
      if (!Number.isFinite(id) || id < 0) continue;
      out[id] = normalizeEntry(v);
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
  const next = normalizeEntry({ ...emptyEntry(), ...all[id], ...patch });
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
    !e.sku.trim() &&
    !e.title.trim() &&
    !e.color.trim() &&
    !e.shell.trim() &&
    !e.lining.trim() &&
    !e.customFit.trim() &&
    !e.dateMade.trim() &&
    !e.year.trim() &&
    !e.collection.trim() &&
    !e.price.trim() &&
    !e.imageUrl.trim()
  );
}

/** Next unused slot index for a new catalog entry. */
export function nextCatalogPieceId(
  catalog: Record<number, CatalogEntry> = loadCatalog()
): number {
  const ids = Object.keys(catalog)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return ids.length === 0 ? 0 : Math.max(...ids) + 1;
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
