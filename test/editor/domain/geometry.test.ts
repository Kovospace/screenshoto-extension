import { describe, expect, it } from 'vitest';
import { constrainEnd, distanceToSegment, spanBox, translate } from '../../../src/editor/domain/geometry';
import type { StepAnnotation, TwoPointAnnotation } from '../../../src/shared/model/Annotation';

describe('geometry', () => {
  it('spans a box whichever way it was drawn', () => {
    expect(spanBox({ x1: 30, y1: 40, x2: 10, y2: 15 })).toEqual({ x: 10, y: 15, w: 20, h: 25 });
  });

  it('measures distance to a segment, its ends and a degenerate segment', () => {
    expect(distanceToSegment({ x: 5, y: 3 }, 0, 0, 10, 0)).toBe(3);
    expect(distanceToSegment({ x: 13, y: 4 }, 0, 0, 10, 0)).toBe(5);
    expect(distanceToSegment({ x: 3, y: 4 }, 0, 0, 0, 0)).toBe(5);
  });

  it('Shift makes boxes square, keeping the drag direction', () => {
    expect(constrainEnd('rect', { x: 0, y: 0 }, { x: -10, y: 4 })).toEqual({ x: -10, y: 10 });
    expect(constrainEnd('ellipse', { x: 0, y: 0 }, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('Shift snaps arrows to 45°', () => {
    const p = constrainEnd('arrow', { x: 0, y: 0 }, { x: 10, y: 9 });
    expect(p.x).toBeCloseTo(p.y);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(Math.hypot(10, 9));
    const flat = constrainEnd('arrow', { x: 0, y: 0 }, { x: 10, y: 2 });
    expect(flat.y).toBeCloseTo(0);
  });

  it('translates point-based and two-point annotations', () => {
    const arrow: TwoPointAnnotation = { type: 'arrow', x1: 0, y1: 0, x2: 5, y2: 5, color: '#000', w: 1 };
    const step: StepAnnotation = { type: 'step', x: 1, y: 1, n: 1, color: '#000', r: 5 };
    translate(arrow, 2, -1);
    translate(step, 2, -1);
    expect(arrow).toMatchObject({ x1: 2, y1: -1, x2: 7, y2: 4 });
    expect(step).toMatchObject({ x: 3, y: 0 });
  });
});
