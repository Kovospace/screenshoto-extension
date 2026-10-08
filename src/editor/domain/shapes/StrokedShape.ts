import type { TwoPointAnnotation } from '../../../shared/model/Annotation';
import type { Point } from '../../../shared/model/Geometry';
import type { SizePreset } from '../../config/editorConfig';
import { spanBox, type Box } from '../geometry';
import type { Handle, ShapeBehavior } from './ShapeBehavior';

/**
 * Template method base for the outlined two-point shapes (rectangle, ellipse, arrow): sets the
 * stroke width and the soft drop shadow, then lets the subclass trace its path.
 */
export abstract class StrokedShape implements ShapeBehavior<TwoPointAnnotation> {
  readonly framedWhenSelected: boolean = true;

  draw(ctx: CanvasRenderingContext2D, a: TwoPointAnnotation): void {
    // Device px per 1× px: keeps the shadow the same size at every scale.
    const k = ctx.getTransform().a;
    ctx.lineWidth = a.w;
    ctx.shadowColor = 'rgba(0,0,0,.28)';
    ctx.shadowBlur = 3 * k;
    ctx.shadowOffsetY = 1 * k;
    this.paint(ctx, a);
  }

  protected abstract paint(ctx: CanvasRenderingContext2D, a: TwoPointAnnotation): void;

  bounds(a: TwoPointAnnotation): Box {
    const r = spanBox(a), pad = a.w / 2;
    return { x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad };
  }

  abstract hitTest(a: TwoPointAnnotation, p: Point, tolerance: number): boolean;

  handles(_a: TwoPointAnnotation): readonly Handle[] {
    return CORNER_HANDLES;
  }

  applySize(a: TwoPointAnnotation, preset: SizePreset): void {
    a.w = preset.stroke;
  }
}

const CORNER_HANDLES: readonly Handle[] = [['x1', 'y1'], ['x2', 'y1'], ['x1', 'y2'], ['x2', 'y2']];
