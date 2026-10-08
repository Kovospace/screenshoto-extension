import type { PickerMode } from '../../shared/messaging/pageGlobals';
import type { PickerLauncher } from '../application/ports';

/** Injects the picker bundle, after leaving the requested mode on the page for it to read. */
export class ScriptingPickerLauncher implements PickerLauncher {
  async launch(tabId: number, mode?: PickerMode): Promise<void> {
    if (mode) {
      await chrome.scripting.executeScript({ target: { tabId }, func: requestMode, args: [mode] });
    }
    await chrome.scripting.executeScript({ target: { tabId }, files: ['picker.js'] });
  }
}

/** Runs in the page (serialised — must not reference anything outside its own body). */
function requestMode(mode: PickerMode): void {
  window.__screenshotoRequestedMode = mode;
}
