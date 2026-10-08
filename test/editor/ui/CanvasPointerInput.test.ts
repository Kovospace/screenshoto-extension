import { describe, expect, it } from 'vitest';
import type { PointerController } from '../../../src/editor/interaction/PointerController';
import { bindCanvasPointer } from '../../../src/editor/ui/CanvasPointerInput';
import type { CanvasStage } from '../../../src/editor/ui/CanvasStage';

function setup(opensTextBox: boolean) {
  const canvas = document.createElement('canvas');
  canvas.setPointerCapture = () => {};
  let editing = false;
  const pointer = {
    shouldCapture: () => true,
    press: () => { editing = opensTextBox; },
    isEditingText: () => editing,
  } as unknown as PointerController;
  bindCanvasPointer(canvas, { toScene: () => ({ x: 0, y: 0 }) } as unknown as CanvasStage, pointer);
  const down = new MouseEvent('pointerdown', { button: 0, cancelable: true });
  canvas.dispatchEvent(down);
  return down;
}

describe('bindCanvasPointer', () => {
  it('cancels the default of a press that opened a text box, so focus stays in it', () => {
    expect(setup(true).defaultPrevented).toBe(true);
  });

  it('leaves other presses alone', () => {
    expect(setup(false).defaultPrevented).toBe(false);
  });
});
