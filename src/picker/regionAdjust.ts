import type { Point, ViewportRect } from '../shared/model/Geometry';

/** A resize handle: a corner or an edge midpoint, named by compass direction. */
export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const HANDLES: readonly HandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/** Which edges a handle drags: -1 = left/top, 1 = right/bottom, 0 = neither on that axis. */
const EDGES: Readonly<Record<HandleId, readonly [-1 | 0 | 1, -1 | 0 | 1]>> = {
  nw: [-1, -1], n: [0, -1], ne: [1, -1], e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0],
};

export function handlePoint(r: ViewportRect, h: HandleId): Point {
  const [ex, ey] = EDGES[h];
  return { x: r.left + (ex + 1) / 2 * r.width, y: r.top + (ey + 1) / 2 * r.height };
}

/** The handle within `tolerance` px of `p` (corners win over edges), or null. */
export function handleAt(r: ViewportRect, p: Point, tolerance: number): HandleId | null {
  return HANDLES.find(h => {
    const q = handlePoint(r, h);
    return Math.abs(q.x - p.x) <= tolerance && Math.abs(q.y - p.y) <= tolerance;
  }) ?? null;
}

export function contains(r: ViewportRect, p: Point): boolean {
  return p.x >= r.left && p.x <= r.left + r.width && p.y >= r.top && p.y <= r.top + r.height;
}

/**
 * The rect after dragging handle `h` of `start` to `p`: the handle's edges follow the pointer,
 * the opposite edges stay put. Dragging past the opposite edge flips the rect instead of
 * inverting it.
 */
export function resize(start: ViewportRect, h: HandleId, p: Point): ViewportRect {
  const [ex, ey] = EDGES[h];
  let x1 = start.left, y1 = start.top, x2 = start.left + start.width, y2 = start.top + start.height;
  if (ex < 0) x1 = p.x; else if (ex > 0) x2 = p.x;
  if (ey < 0) y1 = p.y; else if (ey > 0) y2 = p.y;
  return { left: Math.min(x1, x2), top: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
}

/** `r` shifted by (dx, dy), kept inside a viewport of the given size. */
export function moveWithin(r: ViewportRect, dx: number, dy: number, viewport: { width: number; height: number }): ViewportRect {
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), Math.max(max, 0));
  return {
    ...r,
    left: clamp(r.left + dx, viewport.width - r.width),
    top: clamp(r.top + dy, viewport.height - r.height),
  };
}

export function resizeCursor(h: HandleId): string {
  return h === 'n' || h === 's' ? 'ns-resize' : h === 'e' || h === 'w' ? 'ew-resize'
    : h === 'nw' || h === 'se' ? 'nwse-resize' : 'nesw-resize';
}
