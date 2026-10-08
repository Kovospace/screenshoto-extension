import type { PickerMode } from '../../shared/messaging/pageGlobals';

/** Right-click entries; Chrome groups them under the extension's name. */
const ITEMS: ReadonlyArray<{ id: string; title: string; mode: PickerMode }> = [
  { id: 'capture-area', title: 'Capture area', mode: 'region' },
  { id: 'capture-element', title: 'Capture element', mode: 'element' },
];

/** Everywhere on a page, not on the toolbar icon's own menu. (Typed as an enum by @types/chrome; Chrome takes these strings.) */
const CONTEXTS = ['page', 'selection', 'link', 'image', 'video', 'audio', 'frame', 'editable'] as unknown as
  chrome.contextMenus.CreateProperties['contexts'];

export class CaptureContextMenu {
  /** (Re)creates the entries. Menu items persist across worker restarts, so call this on install/update only. */
  static register(): void {
    chrome.contextMenus.removeAll(() => {
      for (const { id, title } of ITEMS) chrome.contextMenus.create({ id, title, contexts: CONTEXTS });
    });
  }

  /** The picker mode a clicked entry asks for, or undefined if the entry is not ours. */
  static modeFor(menuItemId: string | number): PickerMode | undefined {
    return ITEMS.find(i => i.id === menuItemId)?.mode;
  }
}
