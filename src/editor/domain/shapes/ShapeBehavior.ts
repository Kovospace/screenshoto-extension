import type { Annotation } from '../../../shared/model/Annotation';
import type { Point } from '../../../shared/model/Geometry';
import type { SizePreset } from '../../config/editorConfig';
import type { Box } from '../geometry';

/** A draggable control point: the names of the x and y fields it moves. */
export type Handle = readonly ['x1' | 'x2', 'y1' | 'y2'];

/**
 * Strategy for one annotation type: everything the editor needs to know about a kind of shape.
 * Look implementations up through {@link ShapeRegistry}, never switch on `annotation.type`.
 */
export interface ShapeBehavior<A extends Annotation = Annotation> {
  /**
   * Paints `a` in 1× units. The renderer has already called `save()`, set stroke and fill to
   * `a.color` with round joins and caps, and will `restore()` afterwards.
   */
  draw(ctx: CanvasRenderingContext2D, a: A): void;
  /** Bounding box (including stroke), used for the selection frame. */
  bounds(a: A): Box;
  /** Whether point `p` grabs the shape; `tolerance` is extra slack in 1× units. */
  hitTest(a: A, p: Point, tolerance: number): boolean;
  /** Resize handles shown when selected (may be empty). */
  handles(a: A): readonly Handle[];
  /** Whether a dashed frame is drawn around the selected shape. */
  readonly framedWhenSelected: boolean;
  /** Applies the S/M/L size the user picked to an existing shape. */
  applySize(a: A, preset: SizePreset): void;
}
