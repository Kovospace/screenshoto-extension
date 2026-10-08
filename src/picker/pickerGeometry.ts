import type { PageRect, Point, ViewportRect } from '../shared/model/Geometry';

/** The rectangle spanned by two drag points, whatever direction the drag went. */
export function rectBetween(a: Point, b: Point): ViewportRect {
  return {
    left: Math.min(a.x, b.x), top: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y),
  };
}

export function toPageRect(r: ViewportRect, scroll: Point): PageRect {
  return { x: r.left + scroll.x, y: r.top + scroll.y, width: r.width, height: r.height };
}
