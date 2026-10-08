import type { StepAnnotation } from '../../../shared/model/Annotation';
import type { Point } from '../../../shared/model/Geometry';
import { SIZE_PRESETS } from '../../config/editorConfig';
import type { Snapshot } from '../../model/AnnotationScene';
import { MoveDrag, type Drag } from '../drags';
import type { InteractionContext } from '../InteractionContext';
import type { DrawingTool } from './DrawingTool';

/** Drops the next numbered marker; keeping the button down drags it into place. */
export class StepTool implements DrawingTool {
  constructor(private readonly ctx: InteractionContext) {}

  press(p: Point, before: Snapshot): Drag {
    const { state, scene } = this.ctx;
    this.ctx.recordUndo(before);
    const step: StepAnnotation = {
      type: 'step', x: p.x, y: p.y, n: scene.nextStepNumber(), color: state.color, r: SIZE_PRESETS[state.size].radius,
    };
    scene.add(step);
    this.ctx.select(step);
    // Undo step already recorded above: dragging the new marker must not add another.
    const drag = new MoveDrag(this.ctx, step, p, null);
    this.ctx.redraw();
    this.ctx.scheduleSave();
    this.ctx.refreshControls();
    return drag;
  }
}
