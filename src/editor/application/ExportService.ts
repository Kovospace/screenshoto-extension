import type { Capture, Scale } from '../../shared/model/Capture';
import { downloadLocation, type ExportSettings } from '../model/ExportSettings';
import { exportFileName } from './fileName';
import type { ClipboardWriter, Downloader, ImageExporter, Notifier } from './ports';

const message = (e: unknown) => (e as Error)?.message || String(e);

/** Save and copy of annotated images, with the user-facing outcome as a toast. */
export class ExportService {
  constructor(
    private readonly capture: Capture,
    private readonly images: ImageExporter,
    private readonly downloader: Downloader,
    private readonly clipboard: ClipboardWriter,
    private readonly notifier: Notifier,
    /** Read at each save, so a change in the settings applies immediately. */
    private readonly settings: () => ExportSettings,
  ) {}

  /** Saves each scale as its own file. "Save as" only applies to a single file. */
  async save(scales: readonly Scale[], saveAs: boolean): Promise<void> {
    const settings = this.settings();
    let saved = 0;
    for (const scale of scales) {
      const png = await this.images.render(scale);
      try {
        await this.downloader.download(png, exportFileName(this.capture, scale, settings), saveAs && scales.length === 1);
        saved++;
      } catch (e) {
        if (!/cancel/i.test((e as Error)?.message || '')) this.notifier.toast('Save failed: ' + message(e));
      }
    }
    if (saved) {
      this.notifier.toast(saved === 1
        ? `Saved ${scales[0]}× to ${downloadLocation(settings)}`
        : `Saved ${saved} files to ${downloadLocation(settings)}`);
    }
  }

  async copy(scale: Scale): Promise<void> {
    try {
      await this.clipboard.writePng(this.images.render(scale));
      this.notifier.toast(`Copied ${scale}× image`);
    } catch (e) {
      this.notifier.toast('Copy failed: ' + message(e));
    }
  }
}
