import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GarmentCard } from "../components/GarmentCard";
import { GarmentDetailModal } from "../components/GarmentDetailModal";
import {
  CARD_WIDTH,
  cardOuterHeight,
  ringOffsetsAroundCenter,
} from "../cardLayout";
import { createGarment, type Garment } from "../garmentData";
import { listCatalogPieceIds } from "../catalogStorage";
import { useCatalog } from "../hooks/useCatalog";
import "./HomePage.css";

const CARD_HEIGHT = cardOuterHeight(CARD_WIDTH);
const GAP_X = 14;
const GAP_Y = 20;
const PADDING_X = 8;

function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === "number" && w > 0) setWidth(w);
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

export default function HomePage() {
  const catalog = useCatalog();
  const { ref: canvasWrapRef, width: wrapWidth } =
    useContainerWidth<HTMLDivElement>();
  const [freeMap, setFreeMap] = useState<
    Record<number, { x: number; y: number }>
  >({});
  const [viewMidY, setViewMidY] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight * 0.5 : 520
  );
  const zRef = useRef(50);
  const [detailGarment, setDetailGarment] = useState<Garment | null>(null);

  const pieceIds = useMemo(() => listCatalogPieceIds(catalog), [catalog]);
  const count = pieceIds.length;

  useEffect(() => {
    const onResize = () => setViewMidY(window.innerHeight * 0.5);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const ringOffsets = useMemo(() => ringOffsetsAroundCenter(count), [count]);

  let minDx = 0;
  let maxDx = 0;
  let minDy = 0;
  let maxDy = 0;
  for (const { dx, dy } of ringOffsets) {
    minDx = Math.min(minDx, dx);
    maxDx = Math.max(maxDx, dx);
    minDy = Math.min(minDy, dy);
    maxDy = Math.max(maxDy, dy);
  }

  const stepX = CARD_WIDTH + GAP_X;
  const stepY = CARD_HEIGHT + GAP_Y;
  const spanW = (maxDx - minDx) * stepX + CARD_WIDTH;
  const minCanvasW = Math.max(240, wrapWidth - PADDING_X * 2);
  const canvasInnerW = Math.max(spanW, minCanvasW);
  const canvasStyledWidth = canvasInnerW + PADDING_X * 2;
  const midX = canvasStyledWidth / 2;

  const gridXY = useCallback(
    (index: number) => {
      const { dx, dy } = ringOffsets[index] ?? { dx: 0, dy: 0 };
      const rawLeft = midX - CARD_WIDTH / 2 + dx * stepX;
      const rawTop = viewMidY - CARD_HEIGHT / 2 + dy * stepY;
      return { x: rawLeft, y: rawTop };
    },
    [ringOffsets, midX, viewMidY, stepX, stepY]
  );

  let minTop = Infinity;
  let maxBottom = -Infinity;
  for (let i = 0; i < count; i++) {
    const { y } = gridXY(i);
    minTop = Math.min(minTop, y);
    maxBottom = Math.max(maxBottom, y + CARD_HEIGHT);
  }
  if (count === 0) {
    minTop = 0;
    maxBottom = 0;
  }
  const padTop = Math.max(0, PADDING_X - minTop);
  const shiftedMaxBottom = maxBottom + padTop;
  const canvasContentHeight = shiftedMaxBottom;

  const garments = useMemo(
    () => pieceIds.map((id) => createGarment(id, catalog)),
    [pieceIds, catalog]
  );

  const bringToFront = useCallback(() => {
    zRef.current += 1;
    return zRef.current;
  }, []);

  const onDragEnd = useCallback((id: number, pos: { x: number; y: number }) => {
    setFreeMap((prev) => ({ ...prev, [id]: pos }));
  }, []);

  const handleReset = useCallback(() => {
    setFreeMap({});
  }, []);

  const openDetail = useCallback((g: Garment) => {
    setDetailGarment(g);
  }, []);

  const closeDetail = useCallback(() => setDetailGarment(null), []);

  const gridXYWithPad = useCallback(
    (index: number) => {
      const g = gridXY(index);
      return { x: g.x, y: g.y + padTop };
    },
    [gridXY, padTop]
  );

  const canvasHeight = canvasContentHeight + PADDING_X * 2;

  return (
    <div className="app">
      <button
        type="button"
        className="app__reset"
        onClick={handleReset}
        aria-label="Reset layout — snap all pieces back to the grid"
      >
        Reset
      </button>
      <Link
        className="app__admin"
        to="/admin"
        aria-label="Open admin — edit garments and images"
      >
        Admin
      </Link>
      <div className="app__hero" aria-label="Site branding">
        <h1 className="app__hero-logo">REDFORD VAN WYATT</h1>
        <div className="app__hero-contact">
          <a
            className="app__hero-link app__hero-link--instagram"
            href="https://www.instagram.com/redfordvanwyatt/"
            target="_blank"
            rel="noopener noreferrer"
          >
            @redfordvanwyatt
          </a>
          <span className="app__hero-contact-sep" aria-hidden="true">
            ·
          </span>
          <a
            className="app__hero-link app__hero-link--email"
            href="mailto:love@redfordvanwyatt.com"
          >
            love@redfordvanwyatt.com
          </a>
        </div>
      </div>

      <main className="app__canvas-wrap" ref={canvasWrapRef}>
        <div
          className="app__canvas"
          style={{
            width: canvasStyledWidth,
            height: Math.max(canvasHeight, viewMidY + CARD_HEIGHT),
          }}
        >
          {garments.map((g, index) => {
            const grid = gridXYWithPad(index);
            return (
              <GarmentCard
                key={g.id}
                garment={g}
                gridLeft={grid.x}
                gridTop={grid.y}
                freePosition={freeMap[g.id] ?? null}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                bringToFront={bringToFront}
                onDragEnd={onDragEnd}
                onOpenDetail={openDetail}
              />
            );
          })}
        </div>
      </main>
      <GarmentDetailModal garment={detailGarment} onClose={closeDetail} />
    </div>
  );
}
