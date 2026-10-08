import { describe, expect, it } from 'vitest';
import type { Snapshot } from '../../../src/editor/model/AnnotationScene';
import { History } from '../../../src/editor/model/History';

const s = (v: string) => v as Snapshot;

describe('History', () => {
  it('undoes and redoes, exchanging the current state', () => {
    const h = new History();
    h.record(s('a'));
    h.record(s('b'));
    expect(h.undo(s('c'))).toBe('b');
    expect(h.undo(s('b'))).toBe('a');
    expect(h.undo(s('a'))).toBeUndefined();
    expect(h.redo(s('a'))).toBe('b');
    expect(h.redo(s('b'))).toBe('c');
    expect(h.canRedo).toBe(false);
  });

  it('forgets the redo branch on a new change', () => {
    const h = new History();
    h.record(s('a'));
    h.undo(s('b'));
    h.record(s('a2'));
    expect(h.canRedo).toBe(false);
  });

  it('keeps at most `limit` undo steps, dropping the oldest', () => {
    const h = new History(2);
    h.record(s('1')); h.record(s('2')); h.record(s('3'));
    expect(h.undo(s('x'))).toBe('3');
    expect(h.undo(s('3'))).toBe('2');
    expect(h.canUndo).toBe(false);
  });
});
