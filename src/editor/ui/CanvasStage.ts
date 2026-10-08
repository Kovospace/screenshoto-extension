import type { Point } from '../../shared/model/Geometry';
import { VIEW } from '../config/editorConfig';
import type { Cursor } from '../domain/ToolName';
import type { AnnotationScene } from '../model/AnnotationScene';
import type { EditorState } from '../model/EditorState';
import type { LoadedCapture } from '../model/LoadedCapture';
import type { SceneRenderer } from '../rendering/SceneRenderer';
import type { EditorDom } from './EditorDom';

/**
 * The canvas and its surroundings. The canvas holds the current scale's image at native
 * resolution and is shown CSS-scaled to fit the window ("zoom"); pointer positions are mapped
 * back to 1× units.
 */
export class CanvasStage {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    private readonly dom: EditorDom,
    private readonly session: LoadedCapture,
    private readonly state: EditorState,
    private readonly scene: AnnotationScene,
    private readonly renderer: SceneRenderer,
  ) {
    this.ctx = dom.canvas.getContext('2d')!;
  }

  render(): void {
    const img = this.session.image(this.state.scale);
    if (!img) return;
    this.renderer.renderView(this.ctx, img, this.session.base, this.scene.annotations, {
      selected: this.scene.selected, editing: this.scene.editing, zoom: this.state.zoom,
    });
  }

  /** Sizes the canvas backing store to the current scale's image (this clears it). */
  useScaleImage(): void {
    const img = this.session.image(this.state.scale)!;
    this.dom.canvas.width = img.naturalWidth;
    this.dom.canvas.height = img.naturalHeight;
  }

  /** Fits the capture into the stage (padding around, at most 3×) and records the zoom. */
  fitToStage(): void {
    const { base } = this.session;
    if (!base.w) return;
    const { stage, canvas, wrap } = this.dom;
    const aw = stage.clientWidth - VIEW.padding * 2, ah = stage.clientHeight - VIEW.padding * 2;
    this.state.zoom = Math.max(VIEW.minZoom, Math.min(aw / base.w, ah / base.h, VIEW.maxZoom));
    const w = base.w * this.state.zoom, h = base.h * this.state.zoom;
    canvas.style.width = wrap.style.width = w + 'px';
    canvas.style.height = wrap.style.height = h + 'px';
  }

  setCursor(cursor: Cursor): void {
    this.dom.canvas.dataset.cursor = cursor;
  }

  /** Client (screen) coordinates → 1× scene coordinates. */
  toScene(e: { clientX: number; clientY: number }): Point {
    const r = this.dom.canvas.getBoundingClientRect();
    const { base } = this.session;
    return { x: (e.clientX - r.left) / r.width * base.w, y: (e.clientY - r.top) / r.height * base.h };
  }
}
