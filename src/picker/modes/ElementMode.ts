import { ElementTrail } from '../ElementTrail';
import type { PickerContext, SelectionMode } from './SelectionMode';

/** Hover to highlight an element, ↑/↓ to walk to its parent/back to the child, click or Enter to pick. */
export class ElementMode implements SelectionMode {
  readonly name = 'element';
  readonly hint = 'Click to capture · ↑ parent · ↓ child · Esc cancel';

  constructor(
    private readonly picker: PickerContext,
    private readonly trail: ElementTrail = new ElementTrail(),
  ) {}

  onMouseDown(): void {
    this.pick();
  }

  onMouseMove(e: MouseEvent): void {
    this.trail.hover(this.picker.elementAt(e.clientX, e.clientY));
    this.highlight();
  }

  onMouseUp(): void {}

  onScroll(): void {
    this.highlight();
  }

  onKey(key: string): boolean {
    switch (key) {
      case 'ArrowUp':
        if (this.trail.up()) this.highlight();
        return true;
      case 'ArrowDown':
        if (this.trail.down()) this.highlight();
        return true;
      case 'Enter':
        if (!this.trail.element) return false;
        this.pick();
        return true;
      default:
        return false;
    }
  }

  confirm(): void {
    this.pick();
  }

  private highlight(): void {
    const el = this.trail.element;
    if (el) this.picker.showBox(el.getBoundingClientRect(), true);
  }

  private pick(): void {
    const el = this.trail.element;
    if (el) this.picker.finish(el.getBoundingClientRect(), el);
  }
}
