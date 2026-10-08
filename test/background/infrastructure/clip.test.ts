import { describe, expect, it } from 'vitest';
import { toClip } from '../../../src/background/infrastructure/clip';

describe('toClip', () => {
  it('snaps a fractional rect outwards to whole pixels', () => {
    expect(toClip({ x: 10.4, y: 5.6, width: 20.2, height: 10.1 })).toEqual({ x: 10, y: 5, width: 21, height: 11, scale: 1 });
  });

  it('never starts at a negative coordinate', () => {
    expect(toClip({ x: -3, y: -1.5, width: 10, height: 10 })).toEqual({ x: 0, y: 0, width: 7, height: 9, scale: 1 });
  });

  it('is never empty', () => {
    expect(toClip({ x: 4, y: 4, width: 0, height: 0 })).toMatchObject({ width: 1, height: 1 });
  });
});
