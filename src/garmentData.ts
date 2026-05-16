export const LABEL_LOVE =
  "we love i love you love" as const;

export type Garment = {
  id: number;
  /** Stable seed for placeholder imagery */
  imageSeed: string;
};

export function createGarment(id: number): Garment {
  return {
    id,
    imageSeed: `garment-${id}`,
  };
}
