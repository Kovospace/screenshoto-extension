import type { ClipboardWriter } from '../application/ports';

export class BrowserClipboard implements ClipboardWriter {
  async writePng(png: Promise<Blob>): Promise<void> {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
  }
}
