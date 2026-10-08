import type { Point } from '../../../shared/model/Geometry';
import type { Snapshot } from '../../model/AnnotationScene';
import { MoveDrag, type Drag } from '../drags';
import type { InteractionContext } from '../InteractionContext';
import type { DrawingTool } from './DrawingTool';

/** Selects the topmost annotation under the pointer (or nothing) and lets it be moved. */
export class SelectTool implements DrawingTool {
  constructor(private readonly ctx: InteractionContext) {}

  press(p: Point, before: Snapshot): Drag | null {
    return grab(this.ctx, this.ctx.hits.topAt(p), p, before);
  }
}

/** Selects `target` (may be null = deselect) and starts moving it. */
export function grab(ctx: InteractionContext, target: ReturnType<InteractionContext['hits']['topAt']>,
                     p: Point, before: Snapshot): Drag | null {
  ctx.select(target);
  const drag = target ? new MoveDrag(ctx, target, p, before) : null;
  ctx.adoptSelectionStyle();
  ctx.redraw();
  ctx.refreshControls();
  return drag;
}
