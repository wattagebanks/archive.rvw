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
  /** Saved image URL, or null when none uploaded */
  imageUrl: string | null;
  details: GarmentDetails;
};

export function createGarment(
  id: number,
  catalog: Record<number, CatalogEntry>
): Garment {
  const row = catalog[id] ?? emptyEntry();
  const trimmedUrl = row.imageUrl.trim();
  const imageUrl = trimmedUrl.length > 0 ? trimmedUrl : null;
  return {
    id,
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

export function garmentImageSrc(garment: Garment): string | null {
  return garment.imageUrl;
}
