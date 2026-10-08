import type { TextAnnotation } from '../../shared/model/Annotation';
import type { Snapshot } from '../model/AnnotationScene';
import type { InteractionContext } from '../interaction/InteractionContext';
import type { TextInput, TextInputFactory } from './ports';

/**
 * One text box open over a text annotation. Committing applies the typed text (one undo step);
 * cancelling keeps the old text. Text that ends up empty deletes the annotation.
 */
export class TextEditSession {
  private finished = false;
  private readonly input: TextInput;

  constructor(
    private readonly ctx: InteractionContext,
    private readonly target: TextAnnotation,
    private readonly isNew: boolean,
    private readonly before: Snapshot,
    inputs: TextInputFactory,
    private readonly onClosed: () => void,
  ) {
    ctx.scene.editing = target;
    ctx.redraw();
    this.input = inputs.open(target, ctx.state.zoom, { onCommit: () => this.finish(true), onCancel: () => this.finish(false) });
  }

  commit(): void {
    this.finish(true);
  }

  private finish(keep: boolean): void {
    if (this.finished) return;
    this.finished = true;
    const { ctx, target } = this;
    ctx.scene.editing = null;
    this.onClosed();
    const text = keep ? this.input.value.replace(/\s+$/, '') : target.text;
    this.input.remove();
    if (!text.trim()) {
      ctx.scene.remove(target);
      ctx.select(null);
      // A new, never-filled text leaves no trace in the history.
      if (!this.isNew) ctx.recordUndo(this.before);
    } else if (this.isNew || text !== target.text) {
      ctx.recordUndo(this.before);
      target.text = text;
    }
    ctx.redraw();
    ctx.scheduleSave();
    ctx.refreshControls();
  }
}
