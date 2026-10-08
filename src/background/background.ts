/*
 * Service worker entry point and composition root: builds the object graph and connects it to
 * Chrome events. No logic lives here — see application/CaptureService.ts.
 */
import { isCaptureRequest } from '../shared/messaging/CaptureRequest';
import { IndexedDbCaptureRepository } from '../shared/persistence/IndexedDbCaptureRepository';
import { CaptureService } from './application/CaptureService';
import type { SourceTab } from './application/ports';
import { ActionBadgeIndicator } from './infrastructure/ActionBadgeIndicator';
import { DebuggerPageRenderer } from './infrastructure/DebuggerPageRenderer';
import { ScriptingElementLocator } from './infrastructure/ScriptingElementLocator';
import { ScriptingPickerLauncher } from './infrastructure/ScriptingPickerLauncher';
import { TabEditorLauncher } from './infrastructure/TabEditorLauncher';

const BLOCKED_PAGE_MESSAGE =
  'ShotKit can’t run here: Chrome blocks all extensions on chrome:// pages, the built-in New Tab page and the Web Store.';

const indicator = new ActionBadgeIndicator(chrome.runtime.getManifest().action!.default_title!);
const picker = new ScriptingPickerLauncher();
const captures = new CaptureService({
  renderer: new DebuggerPageRenderer(),
  elementLocator: new ScriptingElementLocator(),
  repository: new IndexedDbCaptureRepository(),
  indicator,
  editor: new TabEditorLauncher(),
});

chrome.action.onClicked.addListener(async tab => {
  if (!tab.id) return;
  try {
    await picker.launch(tab.id);
  } catch {
    indicator.showError(tab.id, BLOCKED_PAGE_MESSAGE);
  }
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  const tab = sender.tab;
  if (!isCaptureRequest(msg) || !tab) return;
  captures.capture(tab as SourceTab, msg.rect, msg.element).catch(e => {
    console.error(e);
    indicator.showError(tab.id!, 'Capture failed: ' + (e?.message || e));
  });
});
