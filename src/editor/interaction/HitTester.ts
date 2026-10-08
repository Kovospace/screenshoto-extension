import type { Annotation } from '../../shared/model/Annotation';
import type { Point } from '../../shared/model/Geometry';
import { POINTER } from '../config/editorConfig';
import type { Handle } from '../domain/shapes/ShapeBehavior';
import type { ShapeRegistry } from '../domain/shapes/ShapeRegistry';
import type { AnnotationScene } from '../model/AnnotationScene';

/** Pointer hit-testing with tolerances that stay constant in screen pixels at any zoom. */
export class HitTester {
  constructor(
    private readonly shapes: ShapeRegistry,
    private readonly scene: AnnotationScene,
    private readonly zoom: () => number,
  ) {}

  hits(a: Annotation, p: Point): boolean {
    return this.shapes.of(a).hitTest(a, p, POINTER.hitTolerance / this.zoom());
  }

  /** The topmost annotation at `p`, or null. */
  topAt(p: Point): Annotation | null {
    const all = this.scene.annotations;
    for (let i = all.length - 1; i >= 0; i--) if (this.hits(all[i], p)) return all[i];
    return null;
  }

  handleAt(a: Annotation, p: Point): Handle | null {
    const tol = POINTER.handleTolerance / this.zoom();
    const corner = a as unknown as Record<string, number>;
    return this.shapes.of(a).handles(a)
      .find(([hx, hy]) => Math.abs(corner[hx] - p.x) <= tol && Math.abs(corner[hy] - p.y) <= tol) ?? null;
  }
}
