import { beforeEach, describe, expect, it } from 'vitest';
import { RegionMode } from '../../../src/picker/modes/RegionMode';
import type { PickerContext } from '../../../src/picker/modes/SelectionMode';
import type { ViewportRect } from '../../../src/shared/model/Geometry';

class FakePicker implements PickerContext {
  box: { rect: ViewportRect; adjustable: boolean } | null = null;
  finished: ViewportRect[] = [];
  hint = '';
  cursor = '';
  showBox(rect: ViewportRect) { this.box = { rect, adjustable: false }; }
  showAdjustableBox(rect: ViewportRect) { this.box = { rect, adjustable: true }; }
  hideBox() { this.box = null; }
  setHint(t: string) { this.hint = t; }
  setCursor(c: string) { this.cursor = c; }
  viewportSize() { return { width: 1000, height: 800 }; }
  elementAt() { return null; }
  finish(rect: ViewportRect) { this.finished.push(rect); }
}

const ev = (x: number, y: number) => ({ clientX: x, clientY: y }) as MouseEvent;

describe('RegionMode', () => {
  let picker: FakePicker;
  let mode: RegionMode;
  const drag = (from: [number, number], to: [number, number]) => {
    mode.onMouseDown(ev(...from));
    mode.onMouseMove(ev(...to));
    mode.onMouseUp(ev(...to));
  };

  beforeEach(() => {
    picker = new FakePicker();
    mode = new RegionMode(picker);
    drag([100, 100], [300, 200]);
  });

  it('does not capture when the drag ends: it offers the region for adjusting', () => {
    expect(picker.finished).toEqual([]);
    expect(picker.box).toEqual({ rect: { left: 100, top: 100, width: 200, height: 100 }, adjustable: true });
    expect(picker.hint).toMatch(/to capture/);
  });

  it('captures the adjusted region with the camera button or Enter', () => {
    mode.confirm();
    expect(mode.onKey('Enter')).toBe(true);
    expect(picker.finished).toEqual([
      { left: 100, top: 100, width: 200, height: 100 },
      { left: 100, top: 100, width: 200, height: 100 },
    ]);
  });

  it('Enter before any region is left to the page', () => {
    expect(new RegionMode(picker).onKey('Enter')).toBe(false);
  });

  it('resizes with a handle', () => {
    drag([300, 200], [350, 260]);
    mode.confirm();
    expect(picker.finished).toEqual([{ left: 100, top: 100, width: 250, height: 160 }]);
  });

  it('moves when dragged inside', () => {
    drag([200, 150], [220, 140]);
    mode.confirm();
    expect(picker.finished).toEqual([{ left: 120, top: 90, width: 200, height: 100 }]);
  });

  it('draws a new region when dragged outside, and a stray click keeps the old one', () => {
    drag([600, 600], [602, 601]);
    expect(picker.box).toEqual({ rect: { left: 100, top: 100, width: 200, height: 100 }, adjustable: true });
    drag([500, 400], [700, 450]);
    mode.confirm();
    expect(picker.finished).toEqual([{ left: 500, top: 400, width: 200, height: 50 }]);
  });

  it('shows what a press would do in the cursor', () => {
    const hover = (x: number, y: number) => { mode.onMouseMove(ev(x, y)); return picker.cursor; };
    expect(hover(300, 200)).toBe('nwse-resize');
    expect(hover(200, 100)).toBe('ns-resize');
    expect(hover(200, 150)).toBe('move');
    expect(hover(50, 50)).toBe('crosshair');
  });

  it('a tiny first drag shows nothing and captures nothing', () => {
    const fresh = new RegionMode(picker);
    picker.box = null;
    fresh.onMouseDown(ev(10, 10));
    fresh.onMouseUp(ev(12, 12));
    expect(picker.box).toBeNull();
    fresh.confirm();
    expect(picker.finished).toEqual([]);
  });
});
