import type { TwoPointAnnotation } from '../../../shared/model/Annotation';
import type { Point } from '../../../shared/model/Geometry';
import { spanBox } from '../geometry';
import { StrokedShape } from './StrokedShape';

export class RectShape extends StrokedShape {
  protected paint(ctx: CanvasRenderingContext2D, a: TwoPointAnnotation): void {
    const r = spanBox(a);
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, Math.min(a.w, r.w / 2, r.h / 2));
    ctx.stroke();
  }

  /** Outline only, so you can still draw inside a box. */
  hitTest(a: TwoPointAnnotation, p: Point, tolerance: number): boolean {
    const r = spanBox(a), t = tolerance + a.w / 2;
    const inOuter = p.x >= r.x - t && p.x <= r.x + r.w + t && p.y >= r.y - t && p.y <= r.y + r.h + t;
    const inInner = p.x > r.x + t && p.x < r.x + r.w - t && p.y > r.y + t && p.y < r.y + r.h - t;
    return inOuter && !inInner;
  }
}
