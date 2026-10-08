import type { CaptureRequest } from '../shared/messaging/CaptureRequest';
import '../shared/messaging/pageGlobals';
import type { ViewportRect } from '../shared/model/Geometry';
import { ElementMode } from './modes/ElementMode';
import { RegionMode } from './modes/RegionMode';
import type { PickerContext, SelectionMode, SelectionModeName } from './modes/SelectionMode';
import { PickerOverlay } from './PickerOverlay';
import { toPageRect } from './pickerGeometry';

/** Where a finished selection goes (the service worker, in production). */
export type CaptureRequestSink = (request: CaptureRequest) => void;

/**
 * Owns one picker session: the overlay, the active {@link SelectionMode}, page-level key/scroll
 * listeners, and the hand-off to the service worker. Mode switches (R/E keys or toolbar)
 * replace the mode with a fresh instance, discarding any half-made selection.
 */
export class PickerController implements PickerContext {
  private mode!: SelectionMode;
  private readonly overlay: PickerOverlay;

  constructor(
    private readonly send: CaptureRequestSink,
    private readonly win: Window = window,
  ) {
    this.overlay = new PickerOverlay(win.document);
  }

  start(mode: SelectionModeName = 'region'): void {
    this.overlay.bind({
      onModeButton: m => this.setMode(m),
      onCancelButton: () => this.cancel(),
      onCameraButton: () => this.mode.confirm(),
    });
    const host = this.overlay.host;
    host.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      this.mode.onMouseDown(e);
    });
    host.addEventListener('mousemove', e => this.mode.onMouseMove(e));
    host.addEventListener('mouseup', e => this.mode.onMouseUp(e));
    // Capture phase, so the page cannot swallow our keys or hide scrolling of inner containers.
    this.win.addEventListener('keydown', this.onKey, true);
    this.win.addEventListener('scroll', this.onScroll, true);

    this.win.__screenshotoPicker = { cancel: () => this.cancel(), setMode: m => this.setMode(m) };
    this.setMode(mode);
    this.overlay.mount();
  }

  setMode(name: SelectionModeName): void {
    this.mode = name === 'region' ? new RegionMode(this) : new ElementMode(this);
    this.hideBox();
    this.overlay.showMode(this.mode.name, this.mode.hint);
  }

  cancel(): void {
    this.win.removeEventListener('keydown', this.onKey, true);
    this.win.removeEventListener('scroll', this.onScroll, true);
    this.overlay.remove();
    delete this.win.__screenshotoPicker;
  }

  // ---- PickerContext ----

  showBox(rect: ViewportRect, isElement: boolean): void {
    this.overlay.showBox(rect, isElement);
  }

  showAdjustableBox(rect: ViewportRect): void {
    this.overlay.showAdjustableBox(rect);
  }

  hideBox(): void {
    this.overlay.hideBox();
  }

  setHint(text: string): void {
    this.overlay.setHint(text);
  }

  setCursor(cursor: string): void {
    this.overlay.setCursor(cursor);
  }

  viewportSize(): { width: number; height: number } {
    return { width: this.win.innerWidth, height: this.win.innerHeight };
  }

  elementAt(x: number, y: number): Element | null {
    return this.overlay.elementAt(x, y);
  }

  finish(r: ViewportRect, element: Element | null): void {
    if (r.width < 1 || r.height < 1) return;
    const rect = toPageRect(r, { x: this.win.scrollX, y: this.win.scrollY });
    this.win.__screenshotoEl = element || null;
    this.cancel();
    // Let the overlay disappear from the rendered frame before capturing.
    this.win.requestAnimationFrame(() => this.win.requestAnimationFrame(() =>
      this.send({ type: 'screenshoto:capture', rect, element: !!element })));
  }

  // ---- page listeners ----

  private readonly onScroll = (): void => this.mode.onScroll();

  private readonly onKey = (e: KeyboardEvent): void => {
    const k = e.key;
    let handled = true;
    if (k === 'Escape') this.cancel();
    else if (k === 'e' || k === 'E') this.setMode('element');
    else if (k === 'r' || k === 'R') this.setMode('region');
    else handled = this.mode.onKey(k);
    if (handled) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
}
