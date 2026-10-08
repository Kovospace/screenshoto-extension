import { HISTORY_LIMIT } from '../config/editorConfig';
import type { Snapshot } from './AnnotationScene';

/**
 * Undo/redo of the annotation scene (Memento pattern): stores scene snapshots taken *before*
 * each change. Recording a new change forgets the redo branch.
 */
export class History {
  private readonly undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];

  constructor(private readonly limit = HISTORY_LIMIT) {}

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Remembers the state before a change. */
  record(before: Snapshot): void {
    this.undoStack.push(before);
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack = [];
  }

  /** Returns the state to go back to (and keeps `current` for redo), or undefined if none. */
  undo(current: Snapshot): Snapshot | undefined {
    if (!this.canUndo) return undefined;
    this.redoStack.push(current);
    return this.undoStack.pop();
  }

  redo(current: Snapshot): Snapshot | undefined {
    if (!this.canRedo) return undefined;
    this.undoStack.push(current);
    return this.redoStack.pop();
  }
}
