/*
 * Globals on the inspected page's window (extension isolated world), shared by the picker
 * content script and functions the service worker injects with chrome.scripting.executeScript.
 *
 * Injected functions are serialised, so they cannot import anything — they spell these names
 * out literally. This declaration only gives both sides the same types.
 */
export {};

declare global {
  interface Window {
    /** Present while a picker overlay is open; injecting the picker again cancels it. */
    __shotkitPicker?: { cancel(): void };
    /** The element the user picked, if any — re-measured by the worker at each scale. */
    __shotkitEl?: Element | null;
  }
}
