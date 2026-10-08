import type { PickerLauncher } from '../application/ports';

/** Injects the picker bundle; injecting it while a picker is open cancels that picker instead. */
export class ScriptingPickerLauncher implements PickerLauncher {
  async launch(tabId: number): Promise<void> {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['picker.js'] });
  }
}
