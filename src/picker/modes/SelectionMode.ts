import type { ViewportRect } from '../../shared/model/Geometry';

export type SelectionModeName = 'region' | 'element';

/** What a selection mode can do to the picker (implemented by PickerController). */
export interface PickerContext {
  showBox(rect: ViewportRect, isElement: boolean): void;
  hideBox(): void;
  /** Topmost page element at a viewport point, looking through the overlay. */
  elementAt(x: number, y: number): Element | null;
  /** Ends picking with this selection. `element` is the picked element, if any. */
  finish(rect: ViewportRect, element: Element | null): void;
}

/** State pattern: the picker delegates input to the active mode. A fresh instance per activation. */
export interface SelectionMode {
  readonly name: SelectionModeName;
  readonly hint: string;
  onMouseDown(e: MouseEvent): void;
  onMouseMove(e: MouseEvent): void;
  onMouseUp(e: MouseEvent): void;
  onScroll(): void;
  /** Returns true when the key was consumed. */
  onKey(key: string): boolean;
}
