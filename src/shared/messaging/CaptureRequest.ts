import type { PageRect } from '../model/Geometry';

/** Picker (content script) → service worker: "capture this region of my tab". */
export interface CaptureRequest {
  type: 'screenshoto:capture';
  /** Region in page CSS pixels. */
  rect: PageRect;
  /**
   * True when an element was picked. The element itself stays in the page as
   * `window.__screenshotoEl`, so the worker can re-measure it after each re-render.
   */
  element: boolean;
}

export const CAPTURE_REQUEST_TYPE = 'screenshoto:capture';

export function isCaptureRequest(msg: unknown): msg is CaptureRequest {
  return (msg as CaptureRequest | undefined)?.type === CAPTURE_REQUEST_TYPE;
}
