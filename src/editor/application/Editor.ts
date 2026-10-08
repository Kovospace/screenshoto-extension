import type { Annotation, TextAnnotation } from '../../shared/model/Annotation';
import type { Scale } from '../../shared/model/Capture';
import { SIZE_PRESETS, type SizeKey } from '../config/editorConfig';
import type { ShapeRegistry } from '../domain/shapes/ShapeRegistry';
import type { Cursor, ToolName } from '../domain/ToolName';
import { translate } from '../domain/geometry';
import type { InteractionContext } from '../interaction/InteractionContext';
import { HitTester } from '../interaction/HitTester';
import type { AnnotationScene, Snapshot } from '../model/AnnotationScene';
import type { EditorState } from '../model/EditorState';
import type { History } from '../model/History';
import type { LoadedCapture } from '../model/LoadedCapture';
import type { EditorCommands } from './EditorCommands';
import type { ExportService } from './ExportService';
import type { Autosaver, EditorView, TextInputFactory } from './ports';
import { TextEditSession } from './TextEditSession';

export interface EditorDeps {
  session: LoadedCapture;
  state: EditorState;
  scene: AnnotationScene;
  history: History;
  shapes: ShapeRegistry;
  view: EditorView;
  autosaver: Autosaver;
  exporter: ExportService;
  textInputs: TextInputFactory;
}

/**
 * The editor's application core (Facade + Mediator): every user command goes through here, and
 * here alone are state, history, persistence and the view kept in step. It is UI-agnostic —
 * the view is an interface, and gestures arrive already translated by PointerController.
 *
 * Rule of thumb for every mutation: record undo *before* changing, then redraw, then schedule a
 * save, then refresh the controls.
 */
export class Editor implements EditorCommands, InteractionContext {
  readonly state: EditorState;
  readonly scene: AnnotationScene;
  readonly hits: HitTester;
  private textEdit: TextEditSession | null = null;

  constructor(private readonly deps: EditorDeps) {
    this.state = deps.state;
    this.scene = deps.scene;
    this.hits = new HitTester(deps.shapes, deps.scene, () => deps.state.zoom);
  }

  // ---- toolbar choices ----

  setTool(tool: ToolName): void {
    this.finishTextEdit();
    this.state.tool = tool;
    this.deps.view.showTool(tool);
  }

  setScale(scale: Scale, initial = false): void {
    if (!this.deps.session.has(scale)) return;
    this.state.scale = scale;
    this.deps.view.showScale(scale);
    this.redraw();
    if (!initial) this.scheduleSave();
  }

  /** Sets the colour for new annotations, and recolours the selected one. */
  setColor(color: string): void {
    this.state.color = color;
    this.deps.view.showColor(color);
    const sel = this.scene.selected;
    if (sel && sel.color !== color) {
      this.recordUndo(this.scene.snapshot());
      sel.color = color;
      this.redraw();
      this.scheduleSave();
    }
  }

  /** Sets the size for new annotations, and resizes the selected one. */
  setSize(size: SizeKey): void {
    this.state.size = size;
    this.deps.view.showSize(size);
    const sel = this.scene.selected;
    if (!sel) return;
    this.recordUndo(this.scene.snapshot());
    this.deps.shapes.of(sel).applySize(sel, SIZE_PRESETS[size]);
    this.redraw();
    this.scheduleSave();
  }

  // ---- history & selection ----

  undo(): void {
    const target = this.deps.history.undo(this.scene.snapshot());
    if (target !== undefined) this.restore(target);
  }

  redo(): void {
    const target = this.deps.history.redo(this.scene.snapshot());
    if (target !== undefined) this.restore(target);
  }

  deleteSelection(): void {
    const sel = this.scene.selected;
    if (!sel) return;
    this.recordUndo(this.scene.snapshot());
    this.scene.remove(sel);
    this.scene.select(null);
    this.redraw();
    this.scheduleSave();
    this.refreshControls();
  }

  deselect(): void {
    this.scene.select(null);
    this.redraw();
    this.refreshControls();
  }

  nudgeSelection(dx: number, dy: number): void {
    const sel = this.scene.selected;
    if (!sel) return;
    this.recordUndo(this.scene.snapshot());
    translate(sel, dx, dy);
    this.redraw();
    this.scheduleSave();
  }

  hasSelection(): boolean {
    return !!this.scene.selected;
  }

  // ---- export ----

  saveCurrent(saveAs: boolean): void {
    this.save([this.state.scale], saveAs);
  }

  saveAll(): void {
    this.save(this.deps.session.scales, false);
  }

  copy(): void {
    this.finishTextEdit();
    this.deps.exporter.copy(this.state.scale);
  }

  private save(scales: readonly Scale[], saveAs: boolean): void {
    this.finishTextEdit();
    this.deps.exporter.save(scales, saveAs);
  }

  // ---- InteractionContext ----

  recordUndo(before: Snapshot): void {
    this.deps.history.record(before);
    this.refreshControls();
  }

  redraw(): void {
    this.deps.view.render();
  }

  scheduleSave(): void {
    this.deps.autosaver.schedule();
  }

  refreshControls(): void {
    this.deps.view.showControls({
      canUndo: this.deps.history.canUndo,
      canRedo: this.deps.history.canRedo,
      hasSelection: !!this.scene.selected,
    });
  }

  adoptSelectionStyle(): void {
    const sel = this.scene.selected;
    if (!sel) return;
    this.state.color = sel.color;
    this.deps.view.showColor(sel.color);
  }

  setCursor(cursor: Cursor): void {
    this.deps.view.setCursor(cursor);
  }

  select(a: Annotation | null): void {
    this.scene.select(a);
  }

  isEditingText(): boolean {
    return !!this.scene.editing;
  }

  finishTextEdit(): void {
    this.textEdit?.commit();
  }

  editText(a: TextAnnotation, isNew: boolean, before: Snapshot = this.scene.snapshot()): void {
    this.textEdit = new TextEditSession(this, a, isNew, before, this.deps.textInputs, () => { this.textEdit = null; });
  }

  private restore(s: Snapshot): void {
    this.scene.restore(s);
    this.redraw();
    this.scheduleSave();
    this.refreshControls();
  }
}
