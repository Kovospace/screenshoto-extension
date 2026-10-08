import type { Point } from '../../shared/model/Geometry';
import { rectBetween } from '../pickerGeometry';
import type { PickerContext, SelectionMode } from './SelectionMode';

/** Smaller drags are treated as a stray click and ignored. */
const MIN_REGION_PX = 4;

/** Drag a rectangle. */
export class RegionMode implements SelectionMode {
  readonly name = 'region';
  readonly hint = 'Drag to select · Esc cancel';
  private start: Point | null = null;

  constructor(private readonly picker: PickerContext) {}

  onMouseDown(e: MouseEvent): void {
    this.start = { x: e.clientX, y: e.clientY };
  }

  onMouseMove(e: MouseEvent): void {
    if (this.start) this.picker.showBox(rectBetween(this.start, { x: e.clientX, y: e.clientY }), false);
  }

  onMouseUp(e: MouseEvent): void {
    if (!this.start) return;
    const r = rectBetween(this.start, { x: e.clientX, y: e.clientY });
    this.start = null;
    if (r.width < MIN_REGION_PX || r.height < MIN_REGION_PX) {
      this.picker.hideBox();
      return;
    }
    this.picker.finish(r, null);
  }

  onScroll(): void {}

  onKey(): boolean {
    return false;
  }
}
