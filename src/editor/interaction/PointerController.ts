import type { Point } from '../../shared/model/Geometry';
import { toolCursor, type ToolName } from '../domain/ToolName';
import { HandleDrag, type Drag } from './drags';
import type { InteractionContext } from './InteractionContext';
import type { DrawingTool } from './tools/DrawingTool';
import { grab, SelectTool } from './tools/SelectTool';
import { ShapeTool } from './tools/ShapeTool';
import { StepTool } from './tools/StepTool';
import { TextTool } from './tools/TextTool';

/** Pointer input in 1× scene coordinates, decoupled from DOM events (so it is testable). */
export interface ScenePointerEvent {
  point: Point;
  shift: boolean;
}

/**
 * Turns presses, moves and releases on the canvas into gestures. A press, in order of priority:
 * finishes an open text box; grabs a handle of the selected shape; grabs the selected shape
 * itself (any tool); otherwise does what the current tool does on empty canvas.
 */
export class PointerController {
  private drag: Drag | null = null;
  private readonly tools: Record<ToolName, DrawingTool>;

  constructor(private readonly ctx: InteractionContext) {
    this.tools = {
      select: new SelectTool(ctx),
      rect: new ShapeTool(ctx, 'rect'),
      ellipse: new ShapeTool(ctx, 'ellipse'),
      arrow: new ShapeTool(ctx, 'arrow'),
      text: new TextTool(ctx),
      step: new StepTool(ctx),
    };
  }

  /** Returns false when the press only closed the text box (the caller should not capture the pointer). */
  shouldCapture(): boolean {
    if (this.ctx.isEditingText()) {
      this.ctx.finishTextEdit();
      return false;
    }
    return true;
  }

  /** Whether a text box is open — e.g. because the last press opened one. */
  isEditingText(): boolean {
    return this.ctx.isEditingText();
  }

  press({ point: p }: ScenePointerEvent): void {
    const { scene, hits, state } = this.ctx;
    const before = scene.snapshot();
    const sel = scene.selected;

    if (sel) {
      const handle = hits.handleAt(sel, p);
      if (handle) {
        this.drag = new HandleDrag(this.ctx, sel, handle, before);
        return;
      }
    }
    if (state.tool !== 'select' && sel && hits.hits(sel, p)) {
      this.drag = grab(this.ctx, sel, p, before);
      return;
    }
    this.drag = this.tools[state.tool].press(p, before);
  }

  move({ point: p, shift }: ScenePointerEvent): void {
    if (!this.drag) {
      this.hover(p);
      return;
    }
    if (this.drag.move(p, shift)) this.ctx.redraw();
  }

  release(): void {
    const drag = this.drag;
    this.drag = null;
    if (!drag) return;
    drag.end();
    this.ctx.refreshControls();
  }

  /** Double-click on a text opens it for editing, whatever the tool. */
  doubleClick({ point }: ScenePointerEvent): void {
    const hit = this.ctx.hits.topAt(point);
    if (hit?.type === 'text') {
      this.ctx.select(hit);
      this.ctx.editText(hit, false);
    }
  }

  private hover(p: Point): void {
    const { scene, hits, state } = this.ctx;
    if (scene.selected && hits.handleAt(scene.selected, p)) return this.ctx.setCursor('handle');
    const hit = hits.topAt(p);
    if (hit && (state.tool === 'select' || hit === scene.selected)) return this.ctx.setCursor('move');
    this.ctx.setCursor(toolCursor(state.tool));
  }
}
