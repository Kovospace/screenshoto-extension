/** A rectangle in page (document) CSS pixels: viewport position plus scroll offset. */
export interface PageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A rectangle in viewport CSS pixels, shaped like `DOMRect` so `getBoundingClientRect()` fits. */
export interface ViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}
