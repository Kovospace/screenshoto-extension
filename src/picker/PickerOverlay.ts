import type { ViewportRect } from '../shared/model/Geometry';
import type { SelectionModeName } from './modes/SelectionMode';

/** Below this distance from the top, the size label goes inside the box so it stays visible. */
const SIZE_LABEL_ROOM_PX = 28;

const TEMPLATE = `
  <style>
    .dim{position:fixed;inset:0;background:rgba(10,12,18,.32)}
    .box{position:fixed;display:none;box-sizing:border-box;border:2px solid #3b82f6;
         box-shadow:0 0 0 200vmax rgba(10,12,18,.32);pointer-events:none}
    .box.el{border-color:#f59e0b;background:rgba(245,158,11,.10);box-shadow:0 0 0 200vmax rgba(10,12,18,.18)}
    .size{position:absolute;left:-2px;top:-26px;font:600 11px/1 system-ui,sans-serif;color:#fff;
          background:#111827;padding:5px 7px;border-radius:5px;white-space:nowrap}
    .size.inside{top:4px;left:4px}
    .bar{position:fixed;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:4px;align-items:center;
         background:#111827;color:#e5e7eb;font:500 12px/1 system-ui,sans-serif;padding:5px;border-radius:10px;
         box-shadow:0 8px 28px rgba(0,0,0,.35);cursor:default;user-select:none}
    button{all:unset;padding:7px 10px;border-radius:7px;cursor:pointer;color:#e5e7eb;display:flex;gap:6px;align-items:center}
    button:hover{background:#1f2937}
    button.on{background:#2563eb;color:#fff}
    kbd{font:inherit;font-size:10px;background:rgba(255,255,255,.14);border-radius:4px;padding:2px 5px}
    .hint{opacity:.7;padding:0 8px;white-space:nowrap}
  </style>
  <div class="dim"></div>
  <div class="box"><span class="size"></span></div>
  <div class="bar">
    <button data-mode="region">Region <kbd>R</kbd></button>
    <button data-mode="element">Element <kbd>E</kbd></button>
    <span class="hint"></span>
    <button data-act="cancel" title="Cancel (Esc)">✕</button>
  </div>`;

export interface OverlayListener {
  onModeButton(mode: SelectionModeName): void;
  onCancelButton(): void;
}

/**
 * The picker's view: a full-page element hosting a closed shadow root (so page CSS cannot reach
 * it) with the dimming layer, the selection box and the toolbar. Knows nothing about modes'
 * logic; the host element is also where page mouse input arrives.
 */
export class PickerOverlay {
  readonly host: HTMLElement;
  private readonly dim: HTMLElement;
  private readonly box: HTMLElement;
  private readonly size: HTMLElement;
  private readonly bar: HTMLElement;
  private readonly hint: HTMLElement;

  constructor(private readonly doc: Document = document) {
    this.host = doc.createElement('shotkit-picker');
    this.host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;cursor:crosshair;';
    const root = this.host.attachShadow({ mode: 'closed' });
    root.innerHTML = TEMPLATE;
    const $ = (s: string) => root.querySelector<HTMLElement>(s)!;
    this.dim = $('.dim');
    this.box = $('.box');
    this.size = $('.size');
    this.bar = $('.bar');
    this.hint = $('.hint');
  }

  bind(listener: OverlayListener): void {
    // Toolbar presses must not start a region drag on the host.
    this.bar.addEventListener('mousedown', e => e.stopPropagation());
    this.bar.addEventListener('click', e => {
      const button = (e.target as Element).closest<HTMLElement>('button');
      if (!button) return;
      if (button.dataset.mode) listener.onModeButton(button.dataset.mode as SelectionModeName);
      if (button.dataset.act === 'cancel') listener.onCancelButton();
    });
  }

  mount(): void {
    this.doc.documentElement.appendChild(this.host);
  }

  remove(): void {
    this.host.remove();
  }

  showMode(mode: SelectionModeName, hint: string): void {
    for (const b of this.bar.querySelectorAll<HTMLElement>('[data-mode]')) b.classList.toggle('on', b.dataset.mode === mode);
    this.hint.textContent = hint;
  }

  showBox(r: ViewportRect, isElement: boolean): void {
    this.dim.style.display = 'none';
    this.box.style.display = 'block';
    this.box.classList.toggle('el', isElement);
    Object.assign(this.box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    this.size.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
    this.size.classList.toggle('inside', r.top < SIZE_LABEL_ROOM_PX);
  }

  hideBox(): void {
    this.box.style.display = 'none';
    this.dim.style.display = 'block';
  }

  /** Hit-tests the page underneath by making the overlay transparent to the pointer for a moment. */
  elementAt(x: number, y: number): Element | null {
    this.host.style.pointerEvents = 'none';
    const target = this.doc.elementFromPoint(x, y);
    this.host.style.pointerEvents = '';
    return target;
  }
}
