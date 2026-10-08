import type { Scale } from '../../shared/model/Capture';
import type { PageRect } from '../../shared/model/Geometry';
import type { PageRenderer, RenderSession } from '../application/ports';
import { base64ToBlob } from './base64';
import { toClip } from './clip';

const PROTOCOL_VERSION = '1.3';

/** Upper bound for waiting on images, and the extra pause after it — see {@link SETTLE_EXPRESSION}. */
const IMAGE_WAIT_MS = 1500;
const AFTER_SETTLE_MS = 120;

/**
 * Evaluated in the page after a DPR change: wait two frames, then for every image still loading
 * (responsive srcset images fetch their higher-density variant), but no longer than IMAGE_WAIT_MS.
 */
const SETTLE_EXPRESSION = `Promise.race([
      new Promise(r => setTimeout(r, ${IMAGE_WAIT_MS})),
      new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))).then(() =>
        Promise.all([...document.images].filter(i => !i.complete).map(i =>
          new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))))
    ])`;

/**
 * Re-renders the page through the DevTools protocol (Emulation.setDeviceMetricsOverride), the
 * way DevTools' own screenshots work. While attached, Chrome shows its mandatory
 * "started debugging this browser" bar.
 */
export class DebuggerPageRenderer implements PageRenderer {
  async attach(tabId: number): Promise<RenderSession> {
    const target: chrome.debugger.Debuggee = { tabId };
    await chrome.debugger.attach(target, PROTOCOL_VERSION);
    return new DebuggerRenderSession(target);
  }
}

class DebuggerRenderSession implements RenderSession {
  constructor(private readonly target: chrome.debugger.Debuggee) {}

  async setDeviceScale(scale: Scale): Promise<void> {
    // width/height 0 keep the real window size; only the density changes.
    await this.send('Emulation.setDeviceMetricsOverride', { width: 0, height: 0, deviceScaleFactor: scale, mobile: false });
  }

  async settle(): Promise<void> {
    await this.send('Runtime.evaluate', { awaitPromise: true, expression: SETTLE_EXPRESSION }).catch(() => {});
    await new Promise(r => setTimeout(r, AFTER_SETTLE_MS));
  }

  async screenshot(rect: PageRect): Promise<Blob> {
    const { data } = (await this.send('Page.captureScreenshot', {
      format: 'png', clip: toClip(rect), captureBeyondViewport: true, fromSurface: true,
    })) as { data: string };
    return base64ToBlob(data, 'image/png');
  }

  async detach(): Promise<void> {
    await this.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
    await chrome.debugger.detach(this.target).catch(() => {});
  }

  private send(method: string, params?: Record<string, unknown>): Promise<unknown> {
    return chrome.debugger.sendCommand(this.target, method, params);
  }
}
