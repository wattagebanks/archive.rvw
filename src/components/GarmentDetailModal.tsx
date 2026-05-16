import { useEffect } from "react";
import type { Garment } from "../garmentData";
import "./GarmentDetailModal.css";

type Props = {
  garment: Garment | null;
  onClose: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="garment-detail-modal__row">
      <dt className="garment-detail-modal__dt">{label}</dt>
      <dd className="garment-detail-modal__dd">{value}</dd>
    </div>
  );
}

export function GarmentDetailModal({ garment, onClose }: Props) {
  useEffect(() => {
    if (!garment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [garment, onClose]);

  if (!garment) return null;

  const { details } = garment;
  const heading = details.title.trim() || `Piece #${garment.id}`;

  return (
    <div
      className="garment-detail-modal__backdrop"
      role="presentation"
      onClick={onClose}
    >
      <dialog
        className="garment-detail-modal"
        open
        aria-labelledby="garment-detail-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="garment-detail-modal__close"
          onClick={onClose}
          aria-label="Close details"
        >
          ×
        </button>
        <h2 id="garment-detail-modal-title" className="garment-detail-modal__title">
          {heading}
        </h2>
        <dl className="garment-detail-modal__list">
          <Row label="Material" value={details.materialType} />
          <Row label="Fabric contents" value={details.fabricContents} />
          <Row label="Color" value={details.color} />
          <Row label="Size" value={details.size} />
        </dl>
        {!details.materialType &&
          !details.fabricContents &&
          !details.color &&
          !details.size &&
          !details.title.trim() && (
            <p className="garment-detail-modal__empty">
              Details for this piece can be added in Admin.
            </p>
          )}
      </dialog>
    </div>
  );
}
