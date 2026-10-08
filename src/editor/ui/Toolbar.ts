import { isScale, type Scale } from '../../shared/model/Capture';
import type { EditorCommands } from '../application/EditorCommands';
import { COLORS, type SizeKey } from '../config/editorConfig';
import type { ToolName } from '../domain/ToolName';
import type { LoadedCapture } from '../model/LoadedCapture';
import type { EditorDom } from './EditorDom';

/** The header bar: wires buttons to commands, and reflects state back into them. */
export class Toolbar {
  constructor(private readonly dom: EditorDom) {}

  bind(commands: EditorCommands, session: LoadedCapture): void {
    const dom = this.dom;
    for (const b of dom.buttons('scale')) {
      const s = Number(b.dataset.scale);
      if (!isScale(s)) continue;
      if (!session.has(s)) {
        b.disabled = true;
        b.title = `${s}× could not be captured (region too large for Chrome at this density)`;
      }
      b.onclick = () => commands.setScale(s);
    }
    for (const b of dom.buttons('tool')) b.onclick = () => commands.setTool(b.dataset.tool as ToolName);
    for (const c of COLORS) {
      const b = document.createElement('button');
      b.className = 'swatch';
      b.dataset.color = c;
      b.title = c;
      b.innerHTML = `<i style="background:${c}"></i>`;
      b.onclick = () => commands.setColor(c);
      dom.colors.append(b);
    }
    for (const b of dom.buttons('size')) b.onclick = () => commands.setSize(b.dataset.size as SizeKey);
    dom.undo.onclick = () => commands.undo();
    dom.redo.onclick = () => commands.redo();
    dom.del.onclick = () => commands.deleteSelection();
    dom.copy.onclick = () => commands.copy();
    dom.save.onclick = e => commands.saveCurrent(e.shiftKey);
    dom.saveAll.onclick = () => commands.saveAll();
  }

  showTool(tool: ToolName): void {
    this.mark('tool', b => b.dataset.tool === tool);
  }

  showColor(color: string): void {
    this.mark('color', b => b.dataset.color === color);
  }

  showSize(size: SizeKey): void {
    this.mark('size', b => b.dataset.size === size);
  }

  showScale(scale: Scale): void {
    this.mark('scale', b => Number(b.dataset.scale) === scale);
    this.dom.save.textContent = `Save ${scale}×`;
  }

  showControls({ canUndo, canRedo, hasSelection }: { canUndo: boolean; canRedo: boolean; hasSelection: boolean }): void {
    this.dom.undo.disabled = !canUndo;
    this.dom.redo.disabled = !canRedo;
    this.dom.del.disabled = !hasSelection;
  }

  showInfo(text: string): void {
    this.dom.info.textContent = text;
  }

  private mark(group: 'scale' | 'tool' | 'size' | 'color', isOn: (b: HTMLButtonElement) => boolean): void {
    for (const b of this.dom.buttons(group)) b.classList.toggle('on', isOn(b));
  }
}
