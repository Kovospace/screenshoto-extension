/**
 * Which element is highlighted in element mode, and the path back down after ↑ walked up to
 * ancestors. Hovering a different element starts a new trail.
 */
export class ElementTrail {
  /** The element under the pointer, as last reported by hover(). */
  private hovered: Element | null = null;
  private current: Element | null = null;
  /** Descendants left behind by up(), most recent last. */
  private readonly below: Element[] = [];

  constructor(private readonly doc: Document = document) {}

  get element(): Element | null {
    return this.current;
  }

  hover(target: Element | null): void {
    if (target && target !== this.hovered) {
      this.hovered = target;
      this.current = target;
      this.below.length = 0;
    }
  }

  /** Moves to the parent; stops below <body>. Returns whether it moved. */
  up(): boolean {
    const el = this.current;
    if (el && el.parentElement && el !== this.doc.body && el !== this.doc.documentElement) {
      this.below.push(el);
      this.current = el.parentElement;
      return true;
    }
    return false;
  }

  /** Moves back to the child up() came from. Returns whether it moved. */
  down(): boolean {
    const child = this.below.pop();
    if (!child) return false;
    this.current = child;
    return true;
  }
}
