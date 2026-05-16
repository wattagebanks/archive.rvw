import { emptyEntry, type CatalogEntry } from "./catalogStorage";

export const LABEL_LOVE = "we love i love you love" as const;

export type GarmentDetails = {
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
      sku: row.sku.trim(),
      title: row.title.trim(),
      color: row.color.trim(),
      shell: row.shell.trim(),
      lining: row.lining.trim(),
      customFit: row.customFit.trim(),
      dateMade: row.dateMade.trim(),
      year: row.year.trim(),
      collection: row.collection.trim(),
      price: row.price.trim(),
      showPrice: row.showPrice,
    },
  };
}

export function garmentImageSrc(garment: Garment): string | null {
  return garment.imageUrl;
}
