import { isScale } from '../../shared/model/Capture';
import type { EditorCommands } from '../application/EditorCommands';
import { NUDGE, TOOL_SHORTCUTS } from '../config/editorConfig';

const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
};

/** Window-level keyboard shortcuts of the editor (see the README's key table). Inactive while typing text. */
export class KeyboardShortcuts {
  constructor(private readonly commands: EditorCommands) {}

  readonly onKeyDown = (e: KeyboardEvent): void => {
    const c = this.commands;
    if (c.isEditingText()) return;
    const k = e.key, lk = k.toLowerCase();

    if (e.ctrlKey || e.metaKey) {
      if (lk === 'z') { e.shiftKey ? c.redo() : c.undo(); e.preventDefault(); }
      else if (lk === 'y') { c.redo(); e.preventDefault(); }
      else if (lk === 'c') { c.copy(); e.preventDefault(); }
      else if (lk === 's') { c.saveCurrent(e.shiftKey); e.preventDefault(); }
      return;
    }

    if (Object.hasOwn(TOOL_SHORTCUTS, lk)) c.setTool(TOOL_SHORTCUTS[lk]);
    else if (/^[1-4]$/.test(k) && isScale(+k)) c.setScale(+k as 1 | 2 | 3 | 4);
    else if (k === 'Delete' || k === 'Backspace') { c.deleteSelection(); e.preventDefault(); }
    else if (k === 'Escape') c.deselect();
    else if (c.hasSelection() && k in ARROWS) {
      const n = e.shiftKey ? NUDGE.shiftStep : NUDGE.step;
      const [dx, dy] = ARROWS[k];
      c.nudgeSelection(dx * n, dy * n);
      e.preventDefault();
    }
  };
}
