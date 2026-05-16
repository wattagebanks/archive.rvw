import { useEffect, useState } from "react";
import {
  CATALOG_STORAGE_KEY,
  CATALOG_UPDATE_EVENT,
  loadCatalog,
  type CatalogEntry,
} from "../catalogStorage";

export function useCatalog(): Record<number, CatalogEntry> {
  const [catalog, setCatalog] = useState<Record<number, CatalogEntry>>(
    () => loadCatalog()
  );

  useEffect(() => {
    const sync = () => setCatalog(loadCatalog());
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === CATALOG_STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CATALOG_UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CATALOG_UPDATE_EVENT, sync);
    };
  }, []);

  return catalog;
}
