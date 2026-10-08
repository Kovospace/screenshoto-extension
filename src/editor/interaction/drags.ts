/*
 * Pointer gestures in progress (State pattern): what a pointer move and release mean depends on
 * how the gesture started. Each records at most one undo step, at its first real change.
 */
import type { TwoPointAnnotation, Annotation } from '../../shared/model/Annotation';
import type { Point } from '../../shared/model/Geometry';
import { POINTER } from '../config/editorConfig';
import { constrainEnd, translate } from '../domain/geometry';
import type { Handle } from '../domain/shapes/ShapeBehavior';
import type { Snapshot } from '../model/AnnotationScene';
import type { InteractionContext } from './InteractionContext';

export interface Drag {
  /** Returns false when nothing changed (no redraw needed). `constrain` = Shift held. */
  move(p: Point, constrain: boolean): boolean;
  end(): void;
}

/** Drawing a new rectangle/ellipse/arrow: the pointer drags its second point. */
export class CreateShapeDrag implements Drag {
  constructor(
    private readonly ctx: InteractionContext,
    private readonly shape: TwoPointAnnotation,
    private readonly start: Point,
    private readonly before: Snapshot,
  ) {}

  move(p: Point, constrain: boolean): boolean {
    const q = constrain ? constrainEnd(this.shape.type, this.start, p) : p;
    this.shape.x2 = q.x;
    this.shape.y2 = q.y;
    return true;
  }

  /** A shape shorter than a few screen pixels was a click, not a drawing: discard it. */
  end(): void {
    const s = this.shape;
    if (Math.hypot(s.x2 - s.x1, s.y2 - s.y1) < POINTER.minShapeLength / this.ctx.state.zoom) {
      this.ctx.scene.remove(s);
      this.ctx.select(null);
    } else {
      this.ctx.recordUndo(this.before);
    }
    this.ctx.redraw();
    this.ctx.scheduleSave();
  }
}

/** Moving an annotation. `before` is null when the undo step was already recorded (new step marker). */
export class MoveDrag implements Drag {
  private changed = false;

  constructor(
    private readonly ctx: InteractionContext,
    private readonly target: Annotation,
    private last: Point,
    private readonly before: Snapshot | null,
  ) {}

  move(p: Point): boolean {
    const dx = p.x - this.last.x, dy = p.y - this.last.y;
    this.last = p;
    if (!dx && !dy) return false;
    if (!this.changed && this.before) this.ctx.recordUndo(this.before);
    this.changed = true;
    translate(this.target, dx, dy);
    return true;
  }

  end(): void {
    if (this.changed) this.ctx.scheduleSave();
  }
}

/** Dragging a resize handle of the selected shape. */
export class HandleDrag implements Drag {
  private changed = false;

  constructor(
    private readonly ctx: InteractionContext,
    private readonly target: Annotation,
    private readonly handle: Handle,
    private readonly before: Snapshot,
  ) {}

  move(p: Point): boolean {
    if (!this.changed) this.ctx.recordUndo(this.before);
    this.changed = true;
    const corner = this.target as unknown as Record<string, number>;
    corner[this.handle[0]] = p.x;
    corner[this.handle[1]] = p.y;
    return true;
  }

  end(): void {
    this.ctx.scheduleSave();
  }
}
