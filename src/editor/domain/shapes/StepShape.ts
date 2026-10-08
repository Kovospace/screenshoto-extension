import type { StepAnnotation } from '../../../shared/model/Annotation';
import type { Point } from '../../../shared/model/Geometry';
import { FONT_FAMILY, type SizePreset } from '../../config/editorConfig';
import { contrastingInk, INK } from '../color';
import type { Box } from '../geometry';
import type { Handle, ShapeBehavior } from './ShapeBehavior';

/** Filled numbered circle marking step 1, 2, 3… */
export class StepShape implements ShapeBehavior<StepAnnotation> {
  readonly framedWhenSelected = true;

  draw(ctx: CanvasRenderingContext2D, a: StepAnnotation): void {
    const k = ctx.getTransform().a; // device px per 1× px — keeps shadows consistent across scales
    const ink = contrastingInk(a.color);

    ctx.shadowColor = 'rgba(0,0,0,.3)';
    ctx.shadowBlur = 3 * k;
    ctx.shadowOffsetY = 1 * k;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.lineWidth = Math.max(1.5, a.r * 0.14);
    ctx.strokeStyle = ink === INK.LIGHT ? INK.LIGHT : 'rgba(0,0,0,.35)';
    ctx.stroke();

    const label = String(a.n);
    ctx.fillStyle = ink;
    ctx.font = `700 ${Math.round(a.r * (label.length > 1 ? 0.95 : 1.15))}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, a.x, a.y + a.r * 0.06);
  }

  bounds(a: StepAnnotation): Box {
    return { x: a.x - a.r, y: a.y - a.r, w: a.r * 2, h: a.r * 2 };
  }

  hitTest(a: StepAnnotation, p: Point, tolerance: number): boolean {
    return Math.hypot(p.x - a.x, p.y - a.y) <= a.r + tolerance;
  }

  handles(): readonly Handle[] {
    return [];
  }

  applySize(a: StepAnnotation, preset: SizePreset): void {
    a.r = preset.radius;
  }
}
