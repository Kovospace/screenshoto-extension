import type { Annotation, AnnotationType } from '../../../shared/model/Annotation';
import type { TextMeasurer } from '../TextMeasurer';
import { ArrowShape } from './ArrowShape';
import { EllipseShape } from './EllipseShape';
import { RectShape } from './RectShape';
import type { ShapeBehavior } from './ShapeBehavior';
import { StepShape } from './StepShape';
import { TextShape } from './TextShape';

type BehaviorMap = { [T in AnnotationType]: ShapeBehavior<Extract<Annotation, { type: T }>> };

/** Maps each annotation type to its {@link ShapeBehavior}. A new shape registers here. */
export class ShapeRegistry {
  private readonly behaviors: BehaviorMap;

  constructor(measurer: TextMeasurer) {
    this.behaviors = {
      rect: new RectShape(),
      ellipse: new EllipseShape(),
      arrow: new ArrowShape(),
      text: new TextShape(measurer),
      step: new StepShape(),
    };
  }

  of<A extends Annotation>(a: A): ShapeBehavior<A> {
    return this.behaviors[a.type] as unknown as ShapeBehavior<A>;
  }
}
