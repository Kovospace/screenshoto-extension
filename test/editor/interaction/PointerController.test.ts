import { describe, expect, it } from 'vitest';
import type { StepAnnotation, TextAnnotation, TwoPointAnnotation } from '../../../src/shared/model/Annotation';
import { editorHarness } from '../../support/editorHarness';

const arrow = (): TwoPointAnnotation => ({ type: 'arrow', x1: 10, y1: 10, x2: 100, y2: 10, color: '#2563eb', w: 4 });
const rect = (): TwoPointAnnotation => ({ type: 'rect', x1: 20, y1: 20, x2: 80, y2: 60, color: '#16a34a', w: 4 });

describe('drawing shapes', () => {
  it('drags out a shape with the current tool, colour and size, as one undo step', () => {
    const h = editorHarness();
    h.editor.setTool('rect');
    h.editor.setSize('L');
    h.drag([10, 10], [30, 20], [50, 40]);
    expect(h.scene.annotations).toEqual([{ type: 'rect', x1: 10, y1: 10, x2: 50, y2: 40, color: '#e5243b', w: 7 }]);
    expect(h.scene.selected).toBe(h.scene.annotations[0]);
    expect(h.view.controls).toEqual({ canUndo: true, canRedo: false, hasSelection: true });
    expect(h.autosaver.scheduled).toBe(1);
    h.editor.undo();
    expect(h.scene.annotations).toEqual([]);
  });

  it('constrains with Shift', () => {
    const h = editorHarness();
    h.editor.setTool('ellipse');
    h.shiftDrag([0, 0], [30, 10]);
    expect(h.scene.annotations[0]).toMatchObject({ x2: 30, y2: 30 });
  });

  it('discards a shape shorter than 4 screen px — at the current zoom', () => {
    const h = editorHarness();
    h.drag([10, 10], [12, 12]);
    expect(h.scene.annotations).toEqual([]);
    expect(h.scene.selected).toBeNull();
    expect(h.view.controls.canUndo).toBe(false);

    h.state.zoom = 4; // 4 screen px = 1 scene px
    h.drag([10, 10], [12, 12]);
    expect(h.scene.annotations).toHaveLength(1);
  });

  it('a click-sized shape discards only itself, even after Ctrl+Z mid-drag', () => {
    // The original removed the *last* annotation here, which after an undo is someone else's.
    const h = editorHarness();
    h.editor.setTool('rect');
    h.drag([10, 10], [40, 40]);
    h.drag([100, 10], [140, 40]);
    h.pointer.press({ point: { x: 150, y: 90 }, shift: false });
    h.editor.undo(); // back to the first rectangle only
    h.pointer.release();
    expect(h.scene.annotations).toHaveLength(1);
    expect(h.scene.annotations[0]).toMatchObject({ x1: 10, x2: 40 });
  });
});

describe('step markers', () => {
  it('numbers markers and lets the new one be dragged into place in a single undo step', () => {
    const h = editorHarness();
    h.editor.setTool('step');
    h.click([10, 10]);
    h.drag([50, 50], [60, 70]);
    const steps = h.scene.annotations as StepAnnotation[];
    expect(steps.map(s => [s.n, s.x, s.y, s.r])).toEqual([[1, 10, 10, 14], [2, 60, 70, 14]]);
    h.editor.undo();
    expect(h.scene.annotations).toHaveLength(1);
  });
});

describe('selecting and moving', () => {
  it('select tool picks the topmost shape and takes over its colour', () => {
    const top = arrow();
    const h = editorHarness({ annotations: [rect(), top] });
    h.editor.setTool('select');
    h.click([50, 10]);
    expect(h.scene.selected).toBe(top);
    expect(h.state.color).toBe('#2563eb');
    expect(h.view.controls.canUndo).toBe(false); // selecting is not an edit
  });

  it('select tool picks the topmost shape even when the selected one lies underneath', () => {
    const below = arrow();
    const above: TwoPointAnnotation = { ...arrow(), x1: 50, x2: 150 };
    const h = editorHarness({ annotations: [below, above] });
    h.editor.setTool('select');
    h.click([20, 10]); // only `below` is here
    expect(h.scene.selected).toBe(below);
    h.click([80, 10]); // both overlap here
    expect(h.scene.selected).toBe(above);
  });

  it('select tool on empty canvas deselects', () => {
    const h = editorHarness({ annotations: [rect()] });
    h.editor.setTool('select');
    h.click([20, 40]);
    h.click([50, 40]); // inside the rectangle: only the outline is hit
    expect(h.scene.selected).toBeNull();
  });

  it('moving records one undo step, and only when something moved', () => {
    const h = editorHarness({ annotations: [arrow()] });
    h.editor.setTool('select');
    h.drag([50, 10], [50, 10]);
    expect(h.view.controls.canUndo).toBe(false);
    expect(h.autosaver.scheduled).toBe(0);
    h.drag([50, 10], [55, 12], [60, 20]);
    expect(h.scene.annotations[0]).toMatchObject({ x1: 20, y1: 20, x2: 110, y2: 20 });
    h.editor.undo();
    expect(h.scene.annotations[0]).toMatchObject({ x1: 10, y1: 10 });
    expect(h.view.controls.canUndo).toBe(false);
  });

  it('with a drawing tool, a press on the selected shape moves it instead of drawing', () => {
    const h = editorHarness({ annotations: [arrow()] });
    h.editor.setTool('select');
    h.click([50, 10]);
    h.editor.setTool('rect');
    h.drag([50, 10], [50, 30]);
    expect(h.scene.annotations).toHaveLength(1);
    expect(h.scene.annotations[0]).toMatchObject({ y1: 30, y2: 30 });
  });

  it('a press on an unselected shape with a drawing tool draws a new one', () => {
    const h = editorHarness({ annotations: [arrow()] });
    h.drag([50, 10], [80, 40]);
    expect(h.scene.annotations).toHaveLength(2);
  });

  it('drags a handle of the selected shape', () => {
    const h = editorHarness({ annotations: [rect()] });
    h.editor.setTool('select');
    h.click([20, 40]);
    h.drag([81, 61], [90, 95]); // within 7 px of (x2, y2)
    expect(h.scene.annotations[0]).toMatchObject({ x1: 20, y1: 20, x2: 90, y2: 95 });
    h.editor.undo();
    expect(h.scene.annotations[0]).toMatchObject({ x2: 80, y2: 60 });
  });
});

describe('hover cursor', () => {
  it('shows what a press would do', () => {
    const h = editorHarness({ annotations: [rect()] });
    const hover = (x: number, y: number) => { h.pointer.move({ point: { x, y }, shift: false }); return h.view.cursor; };
    expect(hover(20, 40)).toBe('crosshair'); // arrow tool: unselected shapes are not grabbed
    h.editor.setTool('select');
    expect(hover(20, 40)).toBe('move');
    expect(hover(150, 90)).toBe('default');
    h.click([20, 40]);
    expect(hover(80, 60)).toBe('handle');
    h.editor.setTool('text');
    expect(hover(20, 40)).toBe('move');
    expect(hover(150, 90)).toBe('text');
  });
});

describe('text', () => {
  it('a press with the text tool starts a new text centred on the first line', () => {
    const h = editorHarness();
    h.editor.setTool('text');
    h.click([40, 50]);
    const t = h.scene.annotations[0] as TextAnnotation;
    expect(t).toMatchObject({ type: 'text', x: 40, y: 50 - 18 * 0.6, text: '', size: 18 });
    expect(h.scene.editing).toBe(t);
    h.texts[0].type('Hi\nthere  \n');
    h.texts[0].pressEnter();
    expect(t.text).toBe('Hi\nthere');
    expect(h.scene.editing).toBeNull();
    expect(h.texts[0].removed).toBe(true);
    h.editor.undo();
    expect(h.scene.annotations).toEqual([]);
  });

  it('a new text left empty disappears without an undo step', () => {
    const h = editorHarness();
    h.editor.setTool('text');
    h.click([40, 50]);
    h.texts[0].blur();
    expect(h.scene.annotations).toEqual([]);
    expect(h.view.controls.canUndo).toBe(false);
  });

  it('Escape keeps the old text; emptying an existing text deletes it (undoably)', () => {
    const existing: TextAnnotation = { type: 'text', x: 10, y: 10, text: 'old', color: '#000', size: 18 };
    const h = editorHarness({ annotations: [existing] });
    h.pointer.doubleClick({ point: { x: 15, y: 15 }, shift: false });
    h.texts[0].type('new');
    h.texts[0].pressEscape();
    expect(existing.text).toBe('old');
    expect(h.view.controls.canUndo).toBe(false);

    h.pointer.doubleClick({ point: { x: 15, y: 15 }, shift: false });
    h.texts[1].type('   ');
    h.texts[1].pressEnter();
    expect(h.scene.annotations).toEqual([]);
    h.editor.undo();
    expect(h.scene.annotations).toEqual([existing]);
  });

  it('a press while a text box is open only closes it', () => {
    const h = editorHarness();
    h.editor.setTool('text');
    h.click([40, 50]);
    h.texts[0].type('A');
    h.click([100, 80]);
    expect(h.scene.annotations).toHaveLength(1);
    expect(h.texts).toHaveLength(1);
    expect((h.scene.annotations[0] as TextAnnotation).text).toBe('A');
  });

  it('the text tool edits an unselected text instead of starting a new one', () => {
    const existing: TextAnnotation = { type: 'text', x: 10, y: 10, text: 'old', color: '#000', size: 18 };
    const h = editorHarness({ annotations: [existing] });
    h.editor.setTool('text');
    h.click([15, 15]);
    expect(h.scene.editing).toBe(existing);
    expect(h.scene.annotations).toHaveLength(1);
  });

  it('closing the box twice (Enter, then the blur that follows) applies once', () => {
    const h = editorHarness();
    h.editor.setTool('text');
    h.click([40, 50]);
    h.texts[0].type('x');
    h.texts[0].pressEnter();
    h.texts[0].blur();
    h.editor.undo();
    expect(h.scene.annotations).toEqual([]);
    expect(h.view.controls.canUndo).toBe(false);
  });
});
