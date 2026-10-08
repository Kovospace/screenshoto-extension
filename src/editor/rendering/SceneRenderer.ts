import type { Annotation } from '../../shared/model/Annotation';
import { POINTER } from '../config/editorConfig';
import type { ShapeRegistry } from '../domain/shapes/ShapeRegistry';
import type { BaseSize } from '../model/LoadedCapture';

export interface SelectionOverlay {
  selected: Annotation | null;
  /** Hidden while its text is edited in a text box. */
  editing: Annotation | null;
  /** Screen zoom, so the frame and handles keep their on-screen size. */
  zoom: number;
}

const SELECTION_COLOR = '#3b82f6';
const HANDLE_STROKE = '#2563eb';

/**
 * Paints a capture image with its annotations. Annotations are in 1× units; the context is
 * scaled by (image px / 1× px) so they land on the same spot at every scale.
 */
export class SceneRenderer {
  constructor(private readonly shapes: ShapeRegistry) {}

  /** The on-screen canvas: image, annotations, selection frame and handles. */
  renderView(ctx: CanvasRenderingContext2D, image: HTMLImageElement, base: BaseSize,
             annotations: readonly Annotation[], overlay: SelectionOverlay): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.paintImage(ctx, image, base);
    for (const a of annotations) if (a !== overlay.editing) this.paintAnnotation(ctx, a);
    const sel = overlay.selected;
    if (sel && sel !== overlay.editing) this.paintSelection(ctx, sel, overlay.zoom);
  }

  /** An exported image: image and annotations only. */
  renderExport(ctx: CanvasRenderingContext2D, image: HTMLImageElement, base: BaseSize,
               annotations: readonly Annotation[]): void {
    this.paintImage(ctx, image, base);
    for (const a of annotations) this.paintAnnotation(ctx, a);
  }

  /** Draws the image at native size, then leaves the context in 1× units. */
  private paintImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, base: BaseSize): void {
    ctx.drawImage(image, 0, 0);
    const f = image.naturalWidth / base.w;
    ctx.setTransform(f, 0, 0, f, 0, 0);
  }

  private paintAnnotation(ctx: CanvasRenderingContext2D, a: Annotation): void {
    ctx.save();
    ctx.strokeStyle = ctx.fillStyle = a.color;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    this.shapes.of(a).draw(ctx, a);
    ctx.restore();
  }

  private paintSelection(ctx: CanvasRenderingContext2D, a: Annotation, zoom: number): void {
    const u = 1 / zoom; // one screen pixel, in 1× units
    const shape = this.shapes.of(a);
    ctx.save();
    if (shape.framedWhenSelected) {
      const b = shape.bounds(a);
      ctx.setLineDash([4 * u, 3 * u]);
      ctx.lineWidth = u;
      ctx.strokeStyle = SELECTION_COLOR;
      ctx.strokeRect(b.x - 4 * u, b.y - 4 * u, b.w + 8 * u, b.h + 8 * u);
      ctx.setLineDash([]);
    }
    const r = POINTER.handleRadius * u;
    for (const [hx, hy] of shape.handles(a)) {
      const corner = a as unknown as Record<string, number>;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = HANDLE_STROKE;
      ctx.lineWidth = 1.5 * u;
      ctx.beginPath();
      ctx.rect(corner[hx] - r, corner[hy] - r, 2 * r, 2 * r);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}
