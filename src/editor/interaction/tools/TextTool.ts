import type { TextAnnotation } from '../../../shared/model/Annotation';
import type { Point } from '../../../shared/model/Geometry';
import { SIZE_PRESETS } from '../../config/editorConfig';
import type { Snapshot } from '../../model/AnnotationScene';
import type { InteractionContext } from '../InteractionContext';
import type { DrawingTool } from './DrawingTool';

/** Click on a text to edit it, anywhere else to start a new one. */
export class TextTool implements DrawingTool {
  constructor(private readonly ctx: InteractionContext) {}

  press(p: Point, before: Snapshot): null {
    const hit = this.ctx.hits.topAt(p);
    if (hit?.type === 'text') {
      this.ctx.select(hit);
      this.ctx.editText(hit, false);
      return null;
    }
    const { state, scene } = this.ctx;
    const size = SIZE_PRESETS[state.size].fontSize;
    // Roughly centre the first line on the click.
    const text: TextAnnotation = { type: 'text', x: p.x, y: p.y - size * 0.6, text: '', color: state.color, size };
    scene.add(text);
    this.ctx.select(text);
    this.ctx.editText(text, true, before);
    return null;
  }
}
