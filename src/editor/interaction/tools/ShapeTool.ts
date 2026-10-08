import type { TwoPointAnnotation, TwoPointType } from '../../../shared/model/Annotation';
import type { Point } from '../../../shared/model/Geometry';
import { SIZE_PRESETS } from '../../config/editorConfig';
import type { Snapshot } from '../../model/AnnotationScene';
import { CreateShapeDrag, type Drag } from '../drags';
import type { InteractionContext } from '../InteractionContext';
import type { DrawingTool } from './DrawingTool';

/** Rectangle, ellipse or arrow: press and drag out. */
export class ShapeTool implements DrawingTool {
  constructor(private readonly ctx: InteractionContext, private readonly type: TwoPointType) {}

  press(p: Point, before: Snapshot): Drag {
    const { state, scene } = this.ctx;
    const shape: TwoPointAnnotation = {
      type: this.type, x1: p.x, y1: p.y, x2: p.x, y2: p.y, color: state.color, w: SIZE_PRESETS[state.size].stroke,
    };
    scene.add(shape);
    this.ctx.select(shape);
    this.ctx.redraw();
    return new CreateShapeDrag(this.ctx, shape, p, before);
  }
}
