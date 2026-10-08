import { describe, expect, it } from 'vitest';
import { loadedCapture } from '../../support/editorHarness';

describe('LoadedCapture', () => {
  it('derives the 1× size from the smallest available scale', () => {
    expect(loadedCapture([3, 4]).base).toEqual({ w: 200, h: 100 });
  });

  it('opens at the remembered scale, else 2×, else the smallest available', () => {
    expect(loadedCapture([1, 2, 3, 4], { lastScale: 4 }).initialScale()).toBe(4);
    expect(loadedCapture([1, 2, 3], { lastScale: 4 }).initialScale()).toBe(2);
    expect(loadedCapture([1, 3]).initialScale()).toBe(1);
    expect(loadedCapture([3, 4]).initialScale()).toBe(3);
  });
});
