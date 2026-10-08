import { beforeEach, describe, expect, it } from 'vitest';
import type { EditorCommands } from '../../../src/editor/application/EditorCommands';
import { KeyboardShortcuts } from '../../../src/editor/ui/KeyboardShortcuts';

describe('KeyboardShortcuts', () => {
  let calls: string[];
  let editing: boolean;
  let selected: boolean;
  let shortcuts: KeyboardShortcuts;

  beforeEach(() => {
    calls = [];
    editing = false;
    selected = true;
    const record = (name: string) => (...args: unknown[]) => { calls.push([name, ...args].join(' ')); };
    const commands: EditorCommands = {
      setTool: record('tool'), setScale: record('scale'), setColor: record('color'), setSize: record('size'),
      undo: record('undo'), redo: record('redo'), deleteSelection: record('delete'), deselect: record('deselect'),
      nudgeSelection: record('nudge'), saveCurrent: record('save'), saveAll: record('saveAll'), copy: record('copy'),
      hasSelection: () => selected, isEditingText: () => editing,
    };
    shortcuts = new KeyboardShortcuts(commands);
  });

  const press = (key: string, mods: Partial<KeyboardEventInit> = {}) => {
    const e = new KeyboardEvent('keydown', { key, cancelable: true, ...mods });
    shortcuts.onKeyDown(e);
    return e.defaultPrevented;
  };

  it('maps the README key table', () => {
    for (const k of ['v', 'R', 'o', 'a', 't', 'n', '1', '4', 'Delete', 'Backspace', 'Escape']) press(k);
    press('z', { ctrlKey: true });
    press('Z', { ctrlKey: true, shiftKey: true });
    press('y', { metaKey: true });
    press('c', { ctrlKey: true });
    press('s', { ctrlKey: true });
    press('s', { ctrlKey: true, shiftKey: true });
    expect(calls).toEqual([
      'tool select', 'tool rect', 'tool ellipse', 'tool arrow', 'tool text', 'tool step',
      'scale 1', 'scale 4', 'delete', 'delete', 'deselect',
      'undo', 'redo', 'redo', 'copy', 'save false', 'save true',
    ]);
  });

  it('nudges by 1 px, or 10 with Shift, only with a selection', () => {
    expect(press('ArrowLeft')).toBe(true);
    press('ArrowDown', { shiftKey: true });
    selected = false;
    expect(press('ArrowUp')).toBe(false);
    expect(calls).toEqual(['nudge -1 0', 'nudge 0 10']);
  });

  it('ignores digits outside 1–4, modifier combos it does not own, and everything while typing', () => {
    press('5');
    press('1', { ctrlKey: true });
    editing = true;
    press('v');
    press('z', { ctrlKey: true });
    expect(calls).toEqual([]);
  });

  it('prevents the browser default only for the keys it handles', () => {
    expect(press('s', { ctrlKey: true })).toBe(true);
    expect(press('Delete')).toBe(true);
    expect(press('v')).toBe(false);
    expect(press('q', { ctrlKey: true })).toBe(false);
  });
});
