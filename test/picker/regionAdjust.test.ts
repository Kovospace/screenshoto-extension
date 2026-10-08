import { describe, expect, it } from 'vitest';
import { handleAt, handlePoint, moveWithin, resize, resizeCursor } from '../../src/picker/regionAdjust';

const r = { left: 100, top: 50, width: 200, height: 100 };

describe('regionAdjust', () => {
  it('places handles on corners and edge midpoints', () => {
    expect(handlePoint(r, 'nw')).toEqual({ x: 100, y: 50 });
    expect(handlePoint(r, 'e')).toEqual({ x: 300, y: 100 });
    expect(handlePoint(r, 's')).toEqual({ x: 200, y: 150 });
  });

  it('finds the handle under the pointer within tolerance', () => {
    expect(handleAt(r, { x: 306, y: 144 }, 8)).toBe('se');
    expect(handleAt(r, { x: 200, y: 58 }, 8)).toBe('n');
    expect(handleAt(r, { x: 200, y: 100 }, 8)).toBeNull();
  });

  it('moves only the dragged edges', () => {
    expect(resize(r, 'e', { x: 350, y: 0 })).toEqual({ left: 100, top: 50, width: 250, height: 100 });
    expect(resize(r, 'nw', { x: 90, y: 40 })).toEqual({ left: 90, top: 40, width: 210, height: 110 });
    expect(resize(r, 's', { x: 999, y: 120 })).toEqual({ left: 100, top: 50, width: 200, height: 70 });
  });

  it('flips instead of inverting when dragged past the opposite edge', () => {
    expect(resize(r, 'w', { x: 350, y: 0 })).toEqual({ left: 300, top: 50, width: 50, height: 100 });
  });

  it('moves within the viewport', () => {
    const vp = { width: 400, height: 300 };
    expect(moveWithin(r, 10, -5, vp)).toEqual({ ...r, left: 110, top: 45 });
    expect(moveWithin(r, 500, -500, vp)).toEqual({ ...r, left: 200, top: 0 });
  });

  it('shows a resize cursor matching the handle', () => {
    expect(['n', 'e', 'nw', 'ne'].map(h => resizeCursor(h as 'n'))).toEqual(['ns-resize', 'ew-resize', 'nwse-resize', 'nesw-resize']);
  });
});
