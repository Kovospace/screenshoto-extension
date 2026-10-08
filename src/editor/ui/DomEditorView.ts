import type { Scale } from '../../shared/model/Capture';
import type { EditorView } from '../application/ports';
import type { SizeKey } from '../config/editorConfig';
import { toolCursor, type Cursor, type ToolName } from '../domain/ToolName';
import type { EditorState } from '../model/EditorState';
import type { LoadedCapture } from '../model/LoadedCapture';
import type { CanvasStage } from './CanvasStage';
import type { Toolbar } from './Toolbar';

/** {@link EditorView} on the editor page: delegates to the toolbar and the canvas stage. */
export class DomEditorView implements EditorView {
  constructor(
    private readonly toolbar: Toolbar,
    private readonly stage: CanvasStage,
    private readonly session: LoadedCapture,
    private readonly state: EditorState,
  ) {}

  render(): void {
    this.stage.render();
  }

  showTool(tool: ToolName): void {
    this.toolbar.showTool(tool);
    this.stage.setCursor(toolCursor(tool));
  }

  showColor(color: string): void {
    this.toolbar.showColor(color);
  }

  showSize(size: SizeKey): void {
    this.toolbar.showSize(size);
  }

  showScale(scale: Scale): void {
    this.stage.useScaleImage();
    this.toolbar.showScale(scale);
    this.updateInfo();
  }

  showControls(controls: { canUndo: boolean; canRedo: boolean; hasSelection: boolean }): void {
    this.toolbar.showControls(controls);
  }

  setCursor(cursor: Cursor): void {
    this.stage.setCursor(cursor);
  }

  /** Re-fits the canvas to the window (on load and resize). */
  layout(): void {
    if (!this.session.base.w) return;
    this.stage.fitToStage();
    this.updateInfo();
    this.render();
  }

  private updateInfo(): void {
    const img = this.session.image(this.state.scale);
    if (img) this.toolbar.showInfo(`${img.naturalWidth} × ${img.naturalHeight} px · view ${Math.round(this.state.zoom * 100)}%`);
  }
}
