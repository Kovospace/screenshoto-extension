import type { TwoPointAnnotation } from '../../../shared/model/Annotation';
import type { Point } from '../../../shared/model/Geometry';
import { spanBox } from '../geometry';
import { StrokedShape } from './StrokedShape';

export class EllipseShape extends StrokedShape {
  protected paint(ctx: CanvasRenderingContext2D, a: TwoPointAnnotation): void {
    const r = spanBox(a);
    ctx.beginPath();
    ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w / 2, 0.5), Math.max(r.h / 2, 0.5), 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** Near the outline (approximate distance via the normalised radius). */
  hitTest(a: TwoPointAnnotation, p: Point, tolerance: number): boolean {
    const r = spanBox(a), rx = Math.max(r.w / 2, 1), ry = Math.max(r.h / 2, 1);
    const d = Math.hypot((p.x - r.x - rx) / rx, (p.y - r.y - ry) / ry);
    return Math.abs(d - 1) * Math.min(rx, ry) <= tolerance + a.w / 2;
  }
}
