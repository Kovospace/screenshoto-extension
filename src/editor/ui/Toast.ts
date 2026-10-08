import type { Notifier } from '../application/ports';
import { TOAST_VISIBLE_MS } from '../config/editorConfig';

export class Toast implements Notifier {
  private timer?: ReturnType<typeof setTimeout>;

  constructor(private readonly el: HTMLElement) {}

  toast(message: string): void {
    this.el.textContent = message;
    this.el.classList.add('show');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.el.classList.remove('show'), TOAST_VISIBLE_MS);
  }
}
