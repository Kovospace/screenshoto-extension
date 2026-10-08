import type { CaptureId } from '../../shared/model/Capture';
import type { EditorLauncher, SourceTab } from '../application/ports';

/** Opens editor.html#<captureId> in a new tab right after the source tab. */
export class TabEditorLauncher implements EditorLauncher {
  async open(id: CaptureId, nextTo: SourceTab): Promise<void> {
    await chrome.tabs.create({
      url: chrome.runtime.getURL('editor.html#' + id), index: nextTo.index + 1, openerTabId: nextTo.id,
    });
  }
}
