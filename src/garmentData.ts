import { emptyEntry, type CatalogEntry } from "./catalogStorage";

export const LABEL_LOVE = "we love i love you love" as const;

export type GarmentDetails = {
  title: string;
  materialType: string;
  fabricContents: string;
  color: string;
  size: string;
};

export type Garment = {
  id: number;
  imageSeed: string;
  /** Custom URL, or null to derive from imageSeed via Picsum */
  imageUrl: string | null;
  details: GarmentDetails;
};

export function createGarment(
  id: number,
  catalog: Record<number, CatalogEntry>
): Garment {
  const row = catalog[id] ?? emptyEntry();
  const imageSeed = row.imageSeed.trim() || `garment-${id}`;
  const trimmedUrl = row.imageUrl.trim();
  const imageUrl = trimmedUrl.length > 0 ? trimmedUrl : null;
  return {
    id,
    imageSeed,
    imageUrl,
    details: {
      title: row.title.trim(),
      materialType: row.materialType.trim(),
      fabricContents: row.fabricContents.trim(),
      color: row.color.trim(),
      size: row.size.trim(),
    },
  };
}

export function garmentImageSrc(
  garment: Garment,
  widthPx: number,
  heightPx: number
): string {
  if (garment.imageUrl) return garment.imageUrl;
  return `https://picsum.photos/seed/${encodeURIComponent(
    garment.imageSeed
  )}/${Math.round(widthPx)}/${Math.round(heightPx)}`;
}
