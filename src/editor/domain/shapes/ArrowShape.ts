import type { TwoPointAnnotation } from '../../../shared/model/Annotation';
import type { Point } from '../../../shared/model/Geometry';
import { distanceToSegment } from '../geometry';
import type { Handle } from './ShapeBehavior';
import { StrokedShape } from './StrokedShape';

/** Half-angle of the arrow head, in radians. */
const HEAD_SPREAD = 0.42;

/** From (x1,y1) to the head at (x2,y2). */
export class ArrowShape extends StrokedShape {
  override readonly framedWhenSelected = false;

  protected paint(ctx: CanvasRenderingContext2D, a: TwoPointAnnotation): void {
    const { x1, y1, x2, y2 } = a;
    const length = Math.hypot(x2 - x1, y2 - y1);
    if (length < 0.5) return;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = Math.min(length * 0.6, Math.max(11, a.w * 4));
    // Shaft stops inside the head so its round cap does not poke through the tip.
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - Math.cos(angle) * head * 0.7, y2 - Math.sin(angle) * head * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle - HEAD_SPREAD), y2 - head * Math.sin(angle - HEAD_SPREAD));
    ctx.lineTo(x2 - head * Math.cos(angle + HEAD_SPREAD), y2 - head * Math.sin(angle + HEAD_SPREAD));
    ctx.closePath();
    ctx.fill();
  }

  hitTest(a: TwoPointAnnotation, p: Point, tolerance: number): boolean {
    return distanceToSegment(p, a.x1, a.y1, a.x2, a.y2) <= tolerance + a.w / 2;
  }

  override handles(): readonly Handle[] {
    return END_HANDLES;
  }
}

const END_HANDLES: readonly Handle[] = [['x1', 'y1'], ['x2', 'y2']];
