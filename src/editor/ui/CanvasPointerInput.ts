import type { PointerController } from '../interaction/PointerController';
import type { CanvasStage } from './CanvasStage';

/** Adapts DOM pointer events on the canvas to {@link PointerController} calls in scene coordinates. */
export function bindCanvasPointer(canvas: HTMLCanvasElement, stage: CanvasStage, pointer: PointerController): void {
  const at = (e: MouseEvent) => ({ point: stage.toScene(e), shift: e.shiftKey });

  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (!pointer.shouldCapture()) return;
    const ev = at(e);
    canvas.setPointerCapture(e.pointerId);
    pointer.press(ev);
    // The press focused a new text box. Without this, the browser's default mousedown action
    // on the (unfocusable) canvas moves focus to <body>, blurring and closing the box at once.
    if (pointer.isEditingText()) e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => pointer.move(at(e)));
  canvas.addEventListener('pointerup', () => pointer.release());
  canvas.addEventListener('pointercancel', () => pointer.release());
  canvas.addEventListener('dblclick', e => pointer.doubleClick(at(e)));
}
