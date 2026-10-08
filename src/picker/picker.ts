/*
 * Injected into the page when the toolbar button is pressed (bundled as a classic script).
 * Injected again while open, it cancels the open picker — the button toggles.
 */
import '../shared/messaging/pageGlobals';
import { PickerController } from './PickerController';

if (window.__shotkitPicker) {
  window.__shotkitPicker.cancel();
} else {
  new PickerController(request => chrome.runtime.sendMessage(request)).start();
}
