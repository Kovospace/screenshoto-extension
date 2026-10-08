import type { Point } from '../../../shared/model/Geometry';
import type { Snapshot } from '../../model/AnnotationScene';
import type { Drag } from '../drags';

/**
 * Strategy for what a press on empty canvas does with a given tool (selection and grabbing the
 * selected shape are handled before the tool is asked).
 */
export interface DrawingTool {
  /** @param before scene state before the press, for the undo step. Returns the gesture to follow, if any. */
  press(p: Point, before: Snapshot): Drag | null;
}
