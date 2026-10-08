import { describe, expect, it } from 'vitest';
import { SIZE_PRESETS } from '../../../../src/editor/config/editorConfig';
import { ShapeRegistry } from '../../../../src/editor/domain/shapes/ShapeRegistry';
import type { StepAnnotation, TextAnnotation, TwoPointAnnotation } from '../../../../src/shared/model/Annotation';
import { fixedWidthMeasurer } from '../../../support/editorHarness';

const shapes = new ShapeRegistry(fixedWidthMeasurer);
const two = (type: TwoPointAnnotation['type'], w = 4): TwoPointAnnotation => ({ type, x1: 10, y1: 10, x2: 110, y2: 60, color: '#e5243b', w });
const text: TextAnnotation = { type: 'text', x: 10, y: 20, text: 'abc\nlonger line', color: '#000', size: 20 };
const step: StepAnnotation = { type: 'step', x: 50, y: 50, n: 3, color: '#000', r: 14 };
const hit = (a: Parameters<typeof shapes.of>[0], x: number, y: number, tol = 6) => shapes.of(a).hitTest(a, { x, y }, tol);

describe('rectangle', () => {
  it('is hit on its outline only, so one can draw inside it', () => {
    const r = two('rect');
    expect(hit(r, 10, 35)).toBe(true);
    expect(hit(r, 2, 35)).toBe(true);   // tolerance 6 + half stroke 2
    expect(hit(r, 1.9, 35)).toBe(false);
    expect(hit(r, 60, 35)).toBe(false); // centre
  });

  it('has four corner handles, a frame, and bounds that include the stroke', () => {
    const r = two('rect');
    expect(shapes.of(r).handles(r)).toHaveLength(4);
    expect(shapes.of(r).framedWhenSelected).toBe(true);
    expect(shapes.of(r).bounds(r)).toEqual({ x: 8, y: 8, w: 104, h: 54 });
  });
});

describe('ellipse', () => {
  it('is hit near its outline', () => {
    const e = two('ellipse');
    expect(hit(e, 60, 10)).toBe(true);
    expect(hit(e, 60, 35)).toBe(false);
    expect(hit(e, 10, 10)).toBe(false); // bounding-box corner
  });
});

describe('arrow', () => {
  it('is hit along its shaft, has end handles and no frame', () => {
    const a = two('arrow');
    expect(hit(a, 60, 35)).toBe(true);
    expect(hit(a, 60, 50)).toBe(false);
    expect(shapes.of(a).handles(a)).toEqual([['x1', 'y1'], ['x2', 'y2']]);
    expect(shapes.of(a).framedWhenSelected).toBe(false);
  });
});

describe('text', () => {
  it('is measured line by line', () => {
    expect(shapes.of(text).bounds(text)).toEqual({ x: 10, y: 20, w: 110, h: 50 });
    expect(hit(text, 125, 25)).toBe(true);
    expect(hit(text, 127, 25)).toBe(false);
  });

  it('is at least 4 px wide when empty', () => {
    expect(shapes.of(text).bounds({ ...text, text: '' }).w).toBe(4);
  });
});

describe('step marker', () => {
  it('is hit within its radius plus tolerance', () => {
    expect(hit(step, 50 + 14 + 6, 50)).toBe(true);
    expect(hit(step, 50 + 14 + 6.1, 50)).toBe(false);
    expect(shapes.of(step).handles(step)).toEqual([]);
  });
});

describe('size presets', () => {
  it('apply the dimension that matters for each shape', () => {
    const r = two('rect'), t = { ...text }, s = { ...step };
    shapes.of(r).applySize(r, SIZE_PRESETS.L);
    shapes.of(t).applySize(t, SIZE_PRESETS.L);
    shapes.of(s).applySize(s, SIZE_PRESETS.L);
    expect([r.w, t.size, s.r]).toEqual([7, 26, 19]);
  });
});
