import '../shared/messaging/pageGlobals';
import { PickerController, type CaptureRequestSink } from './PickerController';

/**
 * What injecting the picker does. Without a requested mode (toolbar button / shortcut) it
 * toggles: opens the picker, or cancels an open one. With a requested mode (context menu) it
 * opens the picker in that mode, or switches an open one to it.
 */
export function launchPicker(send: CaptureRequestSink, win: Window = window): void {
  const requested = win.__screenshotoRequestedMode;
  delete win.__screenshotoRequestedMode;
  const open = win.__screenshotoPicker;
  if (open) {
    if (requested) open.setMode(requested);
    else open.cancel();
    return;
  }
  new PickerController(send, win).start(requested);
}
