import { afterEach, describe, expect, it } from 'vitest';
import { launchPicker } from '../../src/picker/launchPicker';

const open = () => !!document.querySelector('screenshoto-picker');
const send = () => {};

describe('launchPicker', () => {
  afterEach(() => window.__screenshotoPicker?.cancel());

  it('toggles without a requested mode (toolbar button, shortcut)', () => {
    launchPicker(send);
    expect(open()).toBe(true);
    launchPicker(send);
    expect(open()).toBe(false);
  });

  it('opens in the requested mode and consumes the request (context menu)', () => {
    window.__screenshotoRequestedMode = 'element';
    launchPicker(send);
    expect(open()).toBe(true);
    expect(window.__screenshotoRequestedMode).toBeUndefined();
    const up = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true });
    window.dispatchEvent(up);
    expect(up.defaultPrevented).toBe(true); // element mode
  });

  it('switches an open picker to the requested mode instead of closing it', () => {
    launchPicker(send);
    window.__screenshotoRequestedMode = 'element';
    launchPicker(send);
    expect(open()).toBe(true);
    const up = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true });
    window.dispatchEvent(up);
    expect(up.defaultPrevented).toBe(true);
  });
});
