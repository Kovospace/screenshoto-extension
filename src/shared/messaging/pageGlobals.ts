/*
 * Globals on the inspected page's window (extension isolated world), shared by the picker
 * content script and functions the service worker injects with chrome.scripting.executeScript.
 *
 * Injected functions are serialised, so they cannot import anything — they spell these names
 * out literally. This declaration only gives both sides the same types.
 */
export {};

/** How the picker selects: drag a region, or pick an element. */
export type PickerMode = 'region' | 'element';

declare global {
  interface Window {
    /** Present while a picker overlay is open (see picker/launchPicker.ts). */
    __screenshotoPicker?: { cancel(): void; setMode(mode: PickerMode): void };
    /** Set by the worker just before injecting the picker: the mode to start in (context menu). */
    __screenshotoRequestedMode?: PickerMode;
    /** The element the user picked, if any — re-measured by the worker at each scale. */
    __screenshotoEl?: Element | null;
  }
}
