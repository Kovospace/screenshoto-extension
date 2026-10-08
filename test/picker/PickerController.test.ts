import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PickerController } from '../../src/picker/PickerController';
import type { CaptureRequest } from '../../src/shared/messaging/CaptureRequest';

const host = () => document.querySelector('screenshoto-picker') as HTMLElement | null;
const mouse = (type: string, x: number, y: number, button = 0) =>
  host()!.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, button, bubbles: true, cancelable: true }));
const key = (k: string) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
  window.dispatchEvent(e);
  return e;
};

describe('PickerController', () => {
  let sent: CaptureRequest[];

  beforeEach(() => {
    document.body.innerHTML = '<div id="card">card</div>';
    sent = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { cb(0); return 0; });
    new PickerController(r => sent.push(r)).start();
  });
  afterEach(() => {
    window.__screenshotoPicker?.cancel();
    delete window.__screenshotoEl;
    Object.assign(window, { scrollX: 0, scrollY: 0 });
  });

  it('mounts an overlay and registers itself for toggling', () => {
    expect(host()).not.toBeNull();
    expect(window.__screenshotoPicker).toBeDefined();
  });

  it('keeps a dragged region open for adjusting; Enter sends it in page coordinates and closes', () => {
    Object.assign(window, { scrollX: 5, scrollY: 100 });
    mouse('mousedown', 50, 40);
    mouse('mousemove', 20, 10);
    mouse('mouseup', 20, 10);
    expect(sent).toEqual([]);
    expect(host()).not.toBeNull();
    expect(key('Enter').defaultPrevented).toBe(true);
    expect(sent).toEqual([{ type: 'screenshoto:capture', rect: { x: 25, y: 110, width: 30, height: 30 }, element: false }]);
    expect(window.__screenshotoEl).toBeNull();
    expect(host()).toBeNull();
    expect(window.__screenshotoPicker).toBeUndefined();
  });

  it('switches mode when asked by an open picker handle (context menu)', () => {
    window.__screenshotoPicker!.setMode('element');
    expect(key('ArrowUp').defaultPrevented).toBe(true); // only element mode consumes ↑
  });

  it('ignores drags smaller than 4 px and right-button presses', () => {
    mouse('mousedown', 10, 10);
    mouse('mouseup', 13, 30);
    mouse('mousedown', 10, 10, 2);
    mouse('mouseup', 100, 100, 2);
    expect(sent).toEqual([]);
    expect(host()).not.toBeNull();
  });

  it('Escape cancels without sending, and stops the key reaching the page', () => {
    const e = key('Escape');
    expect(e.defaultPrevented).toBe(true);
    expect(host()).toBeNull();
    expect(sent).toEqual([]);
  });

  it('leaves unrelated keys to the page', () => {
    expect(key('x').defaultPrevented).toBe(false);
    expect(key('Enter').defaultPrevented).toBe(false); // region mode: nothing to pick yet
  });

  it('picks an element with Enter, leaving it for the worker to re-measure', () => {
    const card = document.querySelector('#card')!;
    card.getBoundingClientRect = () => ({ left: 1, top: 2, width: 30, height: 40 }) as DOMRect;
    document.elementFromPoint = () => card;
    key('e');
    mouse('mousemove', 5, 5);
    key('Enter');
    expect(sent).toEqual([{ type: 'screenshoto:capture', rect: { x: 1, y: 2, width: 30, height: 40 }, element: true }]);
    expect(window.__screenshotoEl).toBe(card);
  });

  it('element mode consumes ↑/↓ even when there is nowhere to go', () => {
    key('E');
    expect(key('ArrowUp').defaultPrevented).toBe(true);
    expect(key('ArrowDown').defaultPrevented).toBe(true);
    key('r');
    expect(key('ArrowUp').defaultPrevented).toBe(false);
  });

  it('switching mode discards a half-made region', () => {
    mouse('mousedown', 10, 10);
    key('r');
    mouse('mouseup', 100, 100);
    expect(sent).toEqual([]);
  });
});
