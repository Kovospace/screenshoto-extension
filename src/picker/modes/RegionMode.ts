import type { Point, ViewportRect } from '../../shared/model/Geometry';
import { rectBetween } from '../pickerGeometry';
import { contains, handleAt, moveWithin, resize, resizeCursor, type HandleId } from '../regionAdjust';
import type { PickerContext, SelectionMode } from './SelectionMode';

/** Smaller drags are treated as a stray click and ignored. */
const MIN_REGION_PX = 4;
/** How close (px) the pointer must be to a handle to grab it. */
const HANDLE_GRAB_PX = 8;

const DRAW_HINT = 'Drag to select · Esc cancel';
const ADJUST_HINT = 'Drag handles to resize, inside to move · Enter or 📷 to capture · Esc cancel';

/** What a press-drag-release is doing right now. */
type Gesture =
  | { kind: 'draw'; start: Point }
  | { kind: 'resize'; handle: HandleId; from: ViewportRect }
  | { kind: 'move'; last: Point };

/**
 * Drag a rectangle, then adjust it: handles resize, dragging inside moves, dragging outside
 * draws a new one. Capturing is explicit — the 📷 button or Enter.
 */
export class RegionMode implements SelectionMode {
  readonly name = 'region';
  readonly hint = DRAW_HINT;
  /** The finished rectangle being adjusted, if any. */
  private region: ViewportRect | null = null;
  private gesture: Gesture | null = null;

  constructor(private readonly picker: PickerContext) {}

  onMouseDown(e: MouseEvent): void {
    const p = { x: e.clientX, y: e.clientY };
    const r = this.region;
    const handle = r && handleAt(r, p, HANDLE_GRAB_PX);
    if (r && handle) this.gesture = { kind: 'resize', handle, from: r };
    else if (r && contains(r, p)) this.gesture = { kind: 'move', last: p };
    else this.gesture = { kind: 'draw', start: p };
  }

  onMouseMove(e: MouseEvent): void {
    const p = { x: e.clientX, y: e.clientY };
    const g = this.gesture;
    if (!g) return this.hover(p);
    if (g.kind === 'draw') {
      this.picker.showBox(rectBetween(g.start, p), false);
    } else if (g.kind === 'resize') {
      this.adjustTo(resize(g.from, g.handle, p));
    } else {
      this.adjustTo(moveWithin(this.region!, p.x - g.last.x, p.y - g.last.y, this.picker.viewportSize()));
      g.last = p;
    }
  }

  onMouseUp(e: MouseEvent): void {
    const g = this.gesture;
    this.gesture = null;
    if (g?.kind !== 'draw') return;
    const r = rectBetween(g.start, { x: e.clientX, y: e.clientY });
    if (r.width < MIN_REGION_PX || r.height < MIN_REGION_PX) {
      // A stray click: keep the rectangle being adjusted, if there is one.
      if (this.region) this.adjustTo(this.region);
      else this.picker.hideBox();
      return;
    }
    this.adjustTo(r);
    this.picker.setHint(ADJUST_HINT);
  }

  onScroll(): void {}

  onKey(key: string): boolean {
    if (key !== 'Enter' || !this.region) return false;
    this.confirm();
    return true;
  }

  confirm(): void {
    if (this.region) this.picker.finish(this.region, null);
  }

  private adjustTo(r: ViewportRect): void {
    this.region = r;
    this.picker.showAdjustableBox(r);
  }

  private hover(p: Point): void {
    const r = this.region;
    const handle = r && handleAt(r, p, HANDLE_GRAB_PX);
    this.picker.setCursor(handle ? resizeCursor(handle) : r && contains(r, p) ? 'move' : 'crosshair');
  }
}
