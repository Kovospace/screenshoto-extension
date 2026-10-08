import { isTwoPoint, type Annotation, type TwoPointAnnotation, type TwoPointType } from '../../shared/model/Annotation';
import type { Point } from '../../shared/model/Geometry';

/** Axis-aligned box in 1× units. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The box spanned by a two-point annotation, whichever way it was drawn. */
export function spanBox(a: Pick<TwoPointAnnotation, 'x1' | 'y1' | 'x2' | 'y2'>): Box {
  return { x: Math.min(a.x1, a.x2), y: Math.min(a.y1, a.y2), w: Math.abs(a.x2 - a.x1), h: Math.abs(a.y2 - a.y1) };
}

export function distanceToSegment(p: Point, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p.x - x1) * dx + (p.y - y1) * dy) / l2)) : 0;
  return Math.hypot(p.x - (x1 + t * dx), p.y - (y1 + t * dy));
}

/**
 * Shift-drag constraint for the end point `p` of a shape started at `start`:
 * arrows snap to multiples of 45°, boxes become squares/circles.
 */
export function constrainEnd(type: TwoPointType, start: Point, p: Point): Point {
  const dx = p.x - start.x, dy = p.y - start.y;
  if (type === 'arrow') {
    const octant = Math.PI / 4;
    const angle = Math.round(Math.atan2(dy, dx) / octant) * octant, length = Math.hypot(dx, dy);
    return { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length };
  }
  const side = Math.max(Math.abs(dx), Math.abs(dy));
  return { x: start.x + Math.sign(dx || 1) * side, y: start.y + Math.sign(dy || 1) * side };
}

export function translate(a: Annotation, dx: number, dy: number): void {
  if (isTwoPoint(a)) {
    a.x1 += dx; a.x2 += dx; a.y1 += dy; a.y2 += dy;
  } else {
    a.x += dx; a.y += dy;
  }
}
