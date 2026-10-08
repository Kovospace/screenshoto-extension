import type { PageRect } from '../../shared/model/Geometry';
import type { PickedElementLocator } from '../application/ports';
import '../../shared/messaging/pageGlobals';

export class ScriptingElementLocator implements PickedElementLocator {
  async locate(tabId: number): Promise<PageRect | null> {
    try {
      const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func: measurePickedElement });
      return result && result.width > 0 && result.height > 0 ? result : null;
    } catch {
      return null;
    }
  }
}

/** Runs in the page (serialised — must not reference anything outside its own body). */
function measurePickedElement(): PageRect | null {
  const el = window.__screenshotoEl;
  if (!el || !el.isConnected) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
}
