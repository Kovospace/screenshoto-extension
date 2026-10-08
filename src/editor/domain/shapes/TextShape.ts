import type { TextAnnotation } from '../../../shared/model/Annotation';
import type { Point } from '../../../shared/model/Geometry';
import { FONT_FAMILY, TEXT_FONT_WEIGHT, TEXT_LINE_HEIGHT, type SizePreset } from '../../config/editorConfig';
import { contrastingInk } from '../color';
import type { Box } from '../geometry';
import type { TextMeasurer } from '../TextMeasurer';
import type { Handle, ShapeBehavior } from './ShapeBehavior';

export const textFont = (size: number) => `${TEXT_FONT_WEIGHT} ${size}px ${FONT_FAMILY}`;

/** Multi-line label, outlined in a contrasting colour so it reads on any background. */
export class TextShape implements ShapeBehavior<TextAnnotation> {
  readonly framedWhenSelected = true;

  constructor(private readonly measurer: TextMeasurer) {}

  draw(ctx: CanvasRenderingContext2D, a: TextAnnotation): void {
    ctx.font = textFont(a.size);
    ctx.textBaseline = 'top';
    ctx.lineWidth = Math.max(2, a.size * 0.22);
    ctx.strokeStyle = contrastingInk(a.color);
    a.text.split('\n').forEach((line, i) => {
      const y = a.y + i * a.size * TEXT_LINE_HEIGHT;
      ctx.strokeText(line, a.x, y);
      ctx.fillText(line, a.x, y);
    });
  }

  bounds(a: TextAnnotation): Box {
    const font = textFont(a.size);
    const lines = a.text.split('\n');
    const w = Math.max(...lines.map(l => this.measurer.width(l, font)), 4);
    return { x: a.x, y: a.y, w, h: lines.length * a.size * TEXT_LINE_HEIGHT };
  }

  hitTest(a: TextAnnotation, p: Point, tolerance: number): boolean {
    const b = this.bounds(a);
    return p.x >= b.x - tolerance && p.x <= b.x + b.w + tolerance && p.y >= b.y - tolerance && p.y <= b.y + b.h + tolerance;
  }

  handles(): readonly Handle[] {
    return [];
  }

  applySize(a: TextAnnotation, preset: SizePreset): void {
    a.size = preset.fontSize;
  }
}
