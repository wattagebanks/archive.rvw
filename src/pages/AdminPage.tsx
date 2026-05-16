import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  catalogEntryIsEmpty,
  deleteCatalogEntry,
  emptyEntry,
  loadCatalog,
  nextCatalogPieceId,
  upsertCatalogEntry,
  type CatalogEntry,
} from "../catalogStorage";
import { getUploadApiBase, uploadGarmentImageToR2 } from "../lib/r2Upload";
import "./AdminPage.css";

function GarmentInput({
  id,
  placeholder,
  value,
  onChange,
  disabled,
  className,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      id={id}
      className={className ?? "admin-garment__input"}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      autoComplete="off"
    />
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="admin-field">
      <label className="admin-field__label" htmlFor={id}>
        {label}
      </label>
      {hint ? (
        <p className="admin-field__hint admin-field__hint--before">{hint}</p>
      ) : null}
      <input
        id={id}
        className="admin-field__input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
}

function editIdFromSearch(params: URLSearchParams): number | null {
  const raw = params.get("id");
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export default function AdminPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = editIdFromSearch(searchParams);

  const [pieceId, setPieceId] = useState(() =>
    editId !== null ? editId : nextCatalogPieceId()
  );
  const [draft, setDraft] = useState<CatalogEntry>(() => {
    if (editId === null) return emptyEntry();
    const cat = loadCatalog();
    return { ...emptyEntry(), ...cat[editId] };
  });
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadConfigured = useMemo(() => Boolean(getUploadApiBase()), []);

  useEffect(() => {
    return () => uploadAbortRef.current?.abort();
  }, []);

  useEffect(() => {
    setUploadError(null);
  }, [pieceId]);

  const handleUploadPick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      if (!getUploadApiBase()) {
        setUploadError("Upload URL is not configured (VITE_R2_UPLOAD_URL).");
        return;
      }

      uploadAbortRef.current?.abort();
      const ac = new AbortController();
      uploadAbortRef.current = ac;

      setUploadError(null);
      setUploading(true);
      try {
        const url = await uploadGarmentImageToR2(file, pieceId, {
          signal: ac.signal,
        });
        setDraft((d) => ({ ...d, imageUrl: url }));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setUploadError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [pieceId]
  );

  const refreshSavedIds = useCallback(() => {
    const cat = loadCatalog();
    setSavedIds(
      Object.keys(cat)
        .map((k) => Number(k))
        .filter((n) => Number.isFinite(n) && n >= 0)
        .sort((a, b) => a - b)
    );
  }, []);

  useEffect(() => {
    refreshSavedIds();
  }, [refreshSavedIds]);

  useEffect(() => {
    const cat = loadCatalog();
    setDraft({ ...emptyEntry(), ...cat[pieceId] });
  }, [pieceId]);

  useEffect(() => {
    const id = editIdFromSearch(searchParams);
    if (id !== null) {
      setPieceId(id);
      return;
    }
    const nextId = nextCatalogPieceId();
    setPieceId(nextId);
    setDraft(emptyEntry());
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [location.pathname, searchParams]);

  const setParamId = useCallback(
    (nextId: number) => {
      setSearchParams({ id: String(nextId) }, { replace: true });
    },
    [setSearchParams]
  );

  const resetFormForNewEntry = useCallback(() => {
    const nextId = nextCatalogPieceId();
    setDraft(emptyEntry());
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPieceId(nextId);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleSave = useCallback(() => {
    if (catalogEntryIsEmpty(draft)) {
      deleteCatalogEntry(pieceId);
      refreshSavedIds();
      return;
    }
    upsertCatalogEntry(pieceId, draft);
    refreshSavedIds();
    resetFormForNewEntry();
  }, [draft, pieceId, refreshSavedIds, resetFormForNewEntry]);

  const handleClear = useCallback(() => {
    deleteCatalogEntry(pieceId);
    setDraft(emptyEntry());
    refreshSavedIds();
  }, [pieceId, refreshSavedIds]);

  const idsLine = useMemo(() => {
    if (savedIds.length === 0) return "No saved pieces yet.";
    return `Saved slot IDs: ${savedIds.join(", ")}`;
  }, [savedIds]);

  return (
    <div className="admin">
      <header className="admin__header">
        <div className="admin__title-block">
          <h1 className="admin__title">Garment admin</h1>
          <p className="admin__lede">
            Slot index matches the home grid order: 0 is the first ring slot,
            then 1, 2, … Upload an image to send it to R2 (via your Worker),
            or paste an image URL.
          </p>
        </div>
        <Link className="admin__home" to="/">
          ← Home
        </Link>
      </header>

      <div className="admin__layout">
        <aside className="admin__aside">
          <label className="admin-field__label" htmlFor="admin-piece-id">
            Piece slot (#)
          </label>
          <div className="admin__id-row">
            <input
              id="admin-piece-id"
              className="admin-field__input admin__id-input"
              type="number"
              min={0}
              step={1}
              value={pieceId}
              onChange={(e) => {
                const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                setPieceId(v);
                setParamId(v);
              }}
            />
            <div className="admin__id-nav">
              <button
                type="button"
                className="admin__ghost-btn"
                onClick={() => {
                  const v = Math.max(0, pieceId - 1);
                  setPieceId(v);
                  setParamId(v);
                }}
              >
                −
              </button>
              <button
                type="button"
                className="admin__ghost-btn"
                onClick={() => {
                  const v = pieceId + 1;
                  setPieceId(v);
                  setParamId(v);
                }}
              >
                +
              </button>
            </div>
          </div>
          <p className="admin__ids-list" aria-live="polite">
            {idsLine}
          </p>
          <ul className="admin__quick">
            {savedIds.slice(0, 24).map((id) => (
              <li key={id}>
                <button
                  type="button"
                  className={
                    id === pieceId
                      ? "admin__quick-btn admin__quick-btn--active"
                      : "admin__quick-btn"
                  }
                  onClick={() => {
                    setPieceId(id);
                    setParamId(id);
                  }}
                >
                  #{id}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="admin__form-section" aria-label="Piece details">
          <div className="admin-garment">
            <h2 className="admin-garment__title">Add garment</h2>
            <div className="admin-garment__row">
              <GarmentInput
                id="admin-sku"
                placeholder="SKU (unique)"
                value={draft.sku}
                onChange={(sku) => setDraft((d) => ({ ...d, sku }))}
              />
              <GarmentInput
                id="admin-title"
                placeholder="Title"
                value={draft.title}
                onChange={(title) => setDraft((d) => ({ ...d, title }))}
              />
            </div>
            <div className="admin-garment__row">
              <GarmentInput
                id="admin-color"
                placeholder="Color"
                value={draft.color}
                onChange={(color) => setDraft((d) => ({ ...d, color }))}
              />
              <GarmentInput
                id="admin-shell"
                placeholder="Shell"
                value={draft.shell}
                onChange={(shell) => setDraft((d) => ({ ...d, shell }))}
              />
            </div>
            <div className="admin-garment__row">
              <GarmentInput
                id="admin-lining"
                placeholder="Lining"
                value={draft.lining}
                onChange={(lining) => setDraft((d) => ({ ...d, lining }))}
              />
              <GarmentInput
                id="admin-custom-fit"
                placeholder="Custom Fit"
                value={draft.customFit}
                onChange={(customFit) => setDraft((d) => ({ ...d, customFit }))}
              />
            </div>
            <div className="admin-garment__row">
              <GarmentInput
                id="admin-date-made"
                placeholder="Date made (e.g. 2026-05-12)"
                value={draft.dateMade}
                onChange={(dateMade) => setDraft((d) => ({ ...d, dateMade }))}
              />
              <GarmentInput
                id="admin-year"
                placeholder="Year"
                value={draft.year}
                onChange={(year) => setDraft((d) => ({ ...d, year }))}
              />
            </div>
            <div className="admin-garment__row admin-garment__row--full">
              <GarmentInput
                id="admin-collection"
                placeholder="Collection"
                value={draft.collection}
                onChange={(collection) =>
                  setDraft((d) => ({ ...d, collection }))
                }
              />
            </div>
            <div className="admin-garment__price-row">
              <label className="admin-garment__check">
                <input
                  type="checkbox"
                  checked={draft.showPrice}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, showPrice: e.target.checked }))
                  }
                />
                <span>show price</span>
              </label>
              <GarmentInput
                id="admin-price"
                placeholder="Price (USD)"
                value={draft.price}
                onChange={(price) => setDraft((d) => ({ ...d, price }))}
                disabled={!draft.showPrice}
                className="admin-garment__input admin-garment__input--price"
              />
            </div>
          </div>
          <p className="admin-field__hint">
            Title appears under the thumbnail and as the detail popup heading.
          </p>
          <div className="admin__upload">
            <span className="admin-field__label" id="admin-r2-upload-label">
              Image file (R2)
            </span>
            <p className="admin-field__hint admin-field__hint--before">
              {uploadConfigured
                ? "Choose an image — uploads to Cloudflare R2 via the Worker. Run npm run dev so Vite and the upload Worker start together."
                : "Set VITE_R2_UPLOAD_URL in .env (see .env.example), then restart the dev server."}
            </p>
            <input
              id="admin-r2-file"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="admin__file-input"
              aria-labelledby="admin-r2-upload-label"
              onChange={handleFileSelected}
              disabled={!uploadConfigured || uploading}
            />
            <button
              type="button"
              className="admin__secondary"
              onClick={handleUploadPick}
              disabled={!uploadConfigured || uploading}
            >
              {uploading ? "Uploading…" : "Choose image & upload"}
            </button>
            {uploadError ? (
              <p className="admin__upload-error" role="alert">
                {uploadError}
              </p>
            ) : null}
            {draft.imageUrl ? (
              <div className="admin__thumb-wrap">
                <img
                  className="admin__thumb"
                  src={draft.imageUrl}
                  alt="Current image preview"
                />
              </div>
            ) : null}
          </div>
          <Field
            id="admin-image-url"
            label="Image URL"
            value={draft.imageUrl}
            onChange={(imageUrl) => setDraft((d) => ({ ...d, imageUrl }))}
            hint="Filled automatically after R2 upload, or paste any image URL."
          />
          <div className="admin__actions">
            <button type="button" className="admin__primary" onClick={handleSave}>
              Save piece
            </button>
            <button type="button" className="admin__danger" onClick={handleClear}>
              Clear slot
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
