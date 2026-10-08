import { describe, expect, it } from 'vitest';
import type { StepAnnotation, TextAnnotation, TwoPointAnnotation } from '../../../src/shared/model/Annotation';
import { editorHarness } from '../../support/editorHarness';

const arrow = (): TwoPointAnnotation => ({ type: 'arrow', x1: 10, y1: 10, x2: 100, y2: 10, color: '#2563eb', w: 4 });

function withSelectedArrow() {
  const h = editorHarness({ annotations: [arrow()] });
  h.editor.setTool('select');
  h.click([50, 10]);
  return h;
}

describe('Editor', () => {
  it('recolours the selection as one undo step, but not when the colour is unchanged', () => {
    const h = withSelectedArrow();
    h.editor.setColor('#2563eb');
    expect(h.view.controls.canUndo).toBe(false);
    h.editor.setColor('#ffcc00');
    expect(h.scene.annotations[0].color).toBe('#ffcc00');
    expect(h.state.color).toBe('#ffcc00');
    h.editor.undo();
    expect(h.scene.annotations[0].color).toBe('#2563eb');
  });

  it('resizes the selection (always an undo step) and sets the size for new shapes', () => {
    const h = withSelectedArrow();
    h.editor.setSize('M');
    expect(h.view.controls.canUndo).toBe(true);
    h.editor.setSize('S');
    expect((h.scene.annotations[0] as TwoPointAnnotation).w).toBe(2);
    expect(h.state.size).toBe('S');
  });

  it('deletes the selection undoably', () => {
    const h = withSelectedArrow();
    h.editor.deleteSelection();
    expect(h.scene.annotations).toEqual([]);
    expect(h.view.controls).toEqual({ canUndo: true, canRedo: false, hasSelection: false });
    h.editor.undo();
    expect(h.scene.annotations).toEqual([arrow()]);
    expect(h.view.controls.canRedo).toBe(true);
    h.editor.redo();
    expect(h.scene.annotations).toEqual([]);
  });

  it('nudges the selection, one undo step per nudge', () => {
    const h = withSelectedArrow();
    h.editor.nudgeSelection(10, 0);
    h.editor.nudgeSelection(0, -1);
    expect(h.scene.annotations[0]).toMatchObject({ x1: 20, y1: 9 });
    h.editor.undo();
    expect(h.scene.annotations[0]).toMatchObject({ x1: 20, y1: 10 });
  });

  it('does nothing without a selection', () => {
    const h = editorHarness({ annotations: [arrow()] });
    h.editor.deleteSelection();
    h.editor.nudgeSelection(1, 1);
    h.editor.setSize('L');
    h.editor.setColor('#000000');
    expect(h.scene.annotations).toEqual([arrow()]);
    expect(h.view.controls.canUndo).toBe(false);
  });

  it('switches scale only to an available one, persisting the choice', () => {
    const h = editorHarness({ scales: [1, 2, 3] });
    h.editor.setScale(4);
    expect(h.state.scale).toBe(2);
    h.editor.setScale(3);
    expect(h.state.scale).toBe(3);
    expect(h.view.calls).toContain('scale:3');
    expect(h.autosaver.scheduled).toBe(1);
    h.editor.setScale(1, true);
    expect(h.autosaver.scheduled).toBe(1);
  });

  it('closes an open text box before switching tools, saving or copying', () => {
    const h = editorHarness();
    h.editor.setTool('text');
    h.click([40, 50]);
    h.texts[0].type('typed');
    h.editor.saveCurrent(true);
    expect((h.scene.annotations[0] as TextAnnotation).text).toBe('typed');
    expect(h.exporter.save.calls).toEqual([[[2], true]]);
    h.editor.saveAll();
    expect(h.exporter.save.calls[1]).toEqual([[1, 2, 3, 4], false]);
    h.editor.copy();
    expect(h.exporter.copy.calls).toEqual([[2]]);
  });

  it('keeps numbering steps after undo', () => {
    const h = editorHarness();
    h.editor.setTool('step');
    h.click([10, 10]); h.click([60, 10]); h.click([110, 10]); // apart: a press on the selected marker grabs it
    h.editor.undo();
    h.click([160, 10]);
    expect((h.scene.annotations as StepAnnotation[]).map(s => s.n)).toEqual([1, 2, 3]);
  });
});
