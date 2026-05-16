/** Single source for card dimensions (narrow frame + caption below frame on canvas bg). */
export const CARD_WIDTH = 148;

/** Space under framed image → first line of label (GarmentCard.css margin-top caption). */
const LABEL_GAP_UNDER_FRAME = 10;
/** Matches .garment-card__label font-size × line-height × 2 lines */
const LABEL_BLOCK_H = 10 * 1.35 * 2;
/** Hint stack under label */
const HINT_TOP = 3;
const HINT_LINE_H = 7 * 1.15;

/** Total height below the framed image bottom border (caption block on page bg). */
export const CARD_FOOTER_H = Math.round(
  LABEL_GAP_UNDER_FRAME + LABEL_BLOCK_H + HINT_TOP + HINT_LINE_H
);

export function cardInnerWidth(outerWidth: number): number {
  return outerWidth - 2;
}

export function cardMediaHeight(outerWidth: number): number {
  return Math.ceil((cardInnerWidth(outerWidth) * 4) / 3);
}

/** Framed photo: vertical borders only on .garment-card__frame */
function frameOuterHeightPx(outerWidth: number): number {
  return 2 + cardMediaHeight(outerWidth);
}

/** Full card stack for absolute grid positioning */
export function cardOuterHeight(outerWidth: number): number {
  return frameOuterHeightPx(outerWidth) + CARD_FOOTER_H;
}
