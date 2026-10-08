import type { Annotation } from '../../shared/model/Annotation';

/** Serialised annotations: an opaque memento for undo/redo. */
export type Snapshot = string & { readonly __snapshot: unique symbol };

/**
 * The annotations of the open capture, in paint order (last is on top), plus which one is
 * selected and which one is being text-edited. Annotations are mutable: gestures move them in
 * place, so the selection is held by identity.
 */
export class AnnotationScene {
  selected: Annotation | null = null;
  /** The text annotation under the text box; it is hidden from the canvas meanwhile. */
  editing: Annotation | null = null;

  constructor(private items: Annotation[] = []) {}

  get annotations(): readonly Annotation[] {
    return this.items;
  }

  /** The live array, for persisting (the autosaver writes it as-is). */
  toArray(): Annotation[] {
    return this.items;
  }

  add(a: Annotation): void {
    this.items.push(a);
  }

  remove(a: Annotation): void {
    this.items = this.items.filter(x => x !== a);
  }

  select(a: Annotation | null): void {
    this.selected = a;
  }

  /** The number the next step marker gets: one more than the highest so far. */
  nextStepNumber(): number {
    return this.items.reduce((max, a) => (a.type === 'step' ? Math.max(max, a.n) : max), 0) + 1;
  }

  snapshot(): Snapshot {
    return JSON.stringify(this.items) as Snapshot;
  }

  /** Replaces all annotations with fresh copies from `s`; the selection is cleared. */
  restore(s: Snapshot): void {
    this.items = JSON.parse(s);
    this.selected = null;
  }
}
