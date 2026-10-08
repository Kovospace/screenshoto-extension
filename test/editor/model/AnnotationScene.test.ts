import { describe, expect, it } from 'vitest';
import { AnnotationScene } from '../../../src/editor/model/AnnotationScene';
import type { StepAnnotation } from '../../../src/shared/model/Annotation';

const step = (n: number): StepAnnotation => ({ type: 'step', x: 0, y: 0, n, color: '#000', r: 10 });

describe('AnnotationScene', () => {
  it('numbers the next step one above the highest, not the count', () => {
    expect(new AnnotationScene().nextStepNumber()).toBe(1);
    expect(new AnnotationScene([step(1), step(5)]).nextStepNumber()).toBe(6);
  });

  it('restores fresh copies from a snapshot and clears the selection', () => {
    const a = step(1);
    const scene = new AnnotationScene([a]);
    const snap = scene.snapshot();
    a.x = 99;
    scene.select(a);
    scene.restore(snap);
    expect(scene.annotations[0]).toEqual(step(1));
    expect(scene.annotations[0]).not.toBe(a);
    expect(scene.selected).toBeNull();
  });
});
