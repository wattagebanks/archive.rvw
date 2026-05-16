import { useCallback, useEffect, useRef, useState } from "react";
import { cardMediaHeight } from "../cardLayout";
import { LABEL_LOVE, type Garment } from "../garmentData";
import "./GarmentCard.css";

type Props = {
  garment: Garment;
  gridLeft: number;
  gridTop: number;
  freePosition: { x: number; y: number } | null;
  width: number;
  height: number;
  bringToFront: () => number;
  onDragEnd: (id: number, pos: { x: number; y: number }) => void;
};

export function GarmentCard({
  garment,
  gridLeft,
  gridTop,
  freePosition,
  width,
  height,
  bringToFront,
  onDragEnd,
}: Props) {
  const baseLeft = freePosition?.x ?? gridLeft;
  const baseTop = freePosition?.y ?? gridTop;

  const [dragging, setDragging] = useState(false);
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const session = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originLeft: number;
    originTop: number;
  } | null>(null);
  const [zLocal, setZLocal] = useState(1);

  const mediaPx = cardMediaHeight(width);
  const innerPx = width - 2;
  const imgSrc = `https://picsum.photos/seed/${encodeURIComponent(
    garment.imageSeed
  )}/${Math.round(innerPx * 2)}/${Math.round(mediaPx * 2)}`;

  const commitFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const s = session.current;
      if (!s) return;
      const x = s.originLeft + (clientX - s.startClientX);
      const y = s.originTop + (clientY - s.startClientY);
      onDragEnd(garment.id, { x, y });
    },
    [garment.id, onDragEnd]
  );

  const finish = useCallback(
    (e: Pick<PointerEvent, "clientX" | "clientY" | "pointerId">) => {
      const s = session.current;
      if (!s || s.pointerId !== e.pointerId) return;
      commitFromClient(e.clientX, e.clientY);
      session.current = null;
      setDragging(false);
      setDelta({ x: 0, y: 0 });
    },
    [commitFromClient]
  );

  useEffect(() => {
    const onWinPointerUp = (e: PointerEvent) => finish(e);
    window.addEventListener("pointerup", onWinPointerUp);
    window.addEventListener("pointercancel", onWinPointerUp);
    return () => {
      window.removeEventListener("pointerup", onWinPointerUp);
      window.removeEventListener("pointercancel", onWinPointerUp);
    };
  }, [finish]);

  const sesh = session.current;
  const left = dragging && sesh ? sesh.originLeft + delta.x : baseLeft;
  const top = dragging && sesh ? sesh.originTop + delta.y : baseTop;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const z = bringToFront();
    setZLocal(z);
    setDragging(true);
    session.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originLeft: baseLeft,
      originTop: baseTop,
    };
    setDelta({ x: 0, y: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const s = session.current;
    if (!dragging || !s || e.pointerId !== s.pointerId) return;
    setDelta({
      x: e.clientX - s.startClientX,
      y: e.clientY - s.startClientY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const s = session.current;
    if (!s || e.pointerId !== s.pointerId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    finish(e);
  };

  const handleLostCapture = () => {
    session.current = null;
    setDragging(false);
    setDelta({ x: 0, y: 0 });
  };

  return (
    <article
      className="garment-card"
      style={{
        width,
        height,
        left,
        top,
        zIndex: zLocal,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onLostPointerCapture={handleLostCapture}
    >
      <div className="garment-card__frame">
        <div className="garment-card__media" style={{ height: mediaPx }}>
          <img
            src={imgSrc}
            alt=""
            className="garment-card__img"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
      <div className="garment-card__caption">
        <p className="garment-card__label">{LABEL_LOVE}</p>
        <p className="garment-card__hint">drag</p>
      </div>
    </article>
  );
}
