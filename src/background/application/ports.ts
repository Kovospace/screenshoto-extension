/*
 * What the capture use case needs from the outside world. Implemented with Chrome APIs in
 * ../infrastructure, and with fakes in the tests.
 */
import type { CaptureId, Scale } from '../../shared/model/Capture';
import type { PageRect } from '../../shared/model/Geometry';

/** The tab a capture comes from (the subset of chrome.tabs.Tab the use case reads). */
export interface SourceTab {
  id: number;
  index: number;
  url?: string;
  title?: string;
}

/** Opens a session that can re-render a tab at a given device pixel ratio and screenshot it. */
export interface PageRenderer {
  attach(tabId: number): Promise<RenderSession>;
}

export interface RenderSession {
  /** Re-renders the page at this device pixel ratio — real pixels, not upsampling. */
  setDeviceScale(scale: Scale): Promise<void>;
  /** Waits until the re-rendered page has settled (e.g. srcset images loaded). Never throws. */
  settle(): Promise<void>;
  /** PNG of `rect` (page CSS pixels) at the current device scale. Throws if Chrome cannot render it. */
  screenshot(rect: PageRect): Promise<Blob>;
  /** Restores the page and ends the session. Never throws. */
  detach(): Promise<void>;
}

/** Re-measures the element the user picked (`window.__shotkitEl`) in the given tab. */
export interface PickedElementLocator {
  /** Its current rect in page CSS pixels, or null if it is gone, empty, or unreachable. */
  locate(tabId: number): Promise<PageRect | null>;
}

/** Feedback on the toolbar icon. */
export interface StatusIndicator {
  showBusy(tabId: number): Promise<void>;
  clear(tabId: number): Promise<void>;
  /** Shows an error mark and `message` as the icon tooltip for a few seconds. Never throws. */
  showError(tabId: number, message: string): Promise<void>;
}

export interface EditorLauncher {
  /** Opens the editor for a stored capture, next to the tab it came from. */
  open(id: CaptureId, nextTo: SourceTab): Promise<void>;
}

/** Starts the region/element picker in a tab. Rejects if Chrome forbids scripting the page. */
export interface PickerLauncher {
  launch(tabId: number): Promise<void>;
}
