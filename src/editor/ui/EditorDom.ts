/** The elements of editor.html, looked up once. */
export class EditorDom {
  readonly canvas: HTMLCanvasElement;
  readonly wrap: HTMLElement;
  readonly stage: HTMLElement;
  readonly info: HTMLElement;
  readonly toast: HTMLElement;
  readonly colors: HTMLElement;
  readonly undo: HTMLButtonElement;
  readonly redo: HTMLButtonElement;
  readonly del: HTMLButtonElement;
  readonly copy: HTMLButtonElement;
  readonly save: HTMLButtonElement;
  readonly saveAll: HTMLButtonElement;
  readonly openSettings: HTMLButtonElement;

  constructor(private readonly doc: Document = document) {
    const $ = <T extends HTMLElement>(selector: string) => doc.querySelector<T>(selector)!;
    this.canvas = $('#canvas');
    this.wrap = $('#wrap');
    this.stage = $('#stage');
    this.info = $('#info');
    this.toast = $('#toast');
    this.colors = $('#colors');
    this.undo = $('#undo');
    this.redo = $('#redo');
    this.del = $('#del');
    this.copy = $('#copy');
    this.save = $('#save');
    this.saveAll = $('#saveAll');
    this.openSettings = $('#openSettings');
  }

  /** Buttons carrying `data-<name>` (scale, tool, size, color); queried live, colour swatches are added later. */
  buttons(dataName: 'scale' | 'tool' | 'size' | 'color'): HTMLButtonElement[] {
    return [...this.doc.querySelectorAll<HTMLButtonElement>(`[data-${dataName}]`)];
  }

  /** Replaces the editor with a message (capture missing or unreadable). */
  showFatal(message: string): void {
    this.stage.innerHTML = '';
    const d = this.doc.createElement('div');
    d.className = 'fatal';
    d.textContent = message;
    this.stage.append(d);
  }
}
