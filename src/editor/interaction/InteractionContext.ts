import type { Annotation, TextAnnotation } from '../../shared/model/Annotation';
import type { Cursor } from '../domain/ToolName';
import type { AnnotationScene, Snapshot } from '../model/AnnotationScene';
import type { EditorState } from '../model/EditorState';
import type { HitTester } from './HitTester';

/**
 * What pointer gestures and tools may do to the editor (implemented by Editor). Keeps the
 * interaction classes away from the DOM, persistence and the rest of the editor's API.
 */
export interface InteractionContext {
  readonly state: EditorState;
  readonly scene: AnnotationScene;
  readonly hits: HitTester;

  /** Records `before` as an undo step. */
  recordUndo(before: Snapshot): void;
  redraw(): void;
  /** Persists annotations soon (debounced). */
  scheduleSave(): void;
  /** Re-evaluates undo/redo/delete button states. */
  refreshControls(): void;
  /** Takes over the selected annotation's colour as the current colour. */
  adoptSelectionStyle(): void;
  setCursor(cursor: Cursor): void;

  isEditingText(): boolean;
  finishTextEdit(): void;
  /** Opens the text box on `a`. For a new annotation, `before` is the state without it. */
  editText(a: TextAnnotation, isNew: boolean, before?: Snapshot): void;
  select(a: Annotation | null): void;
}
