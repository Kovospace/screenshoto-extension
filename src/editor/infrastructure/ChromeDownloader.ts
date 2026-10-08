import { DOWNLOAD_URL_LIFETIME_MS } from '../config/editorConfig';
import type { Downloader } from '../application/ports';

export class ChromeDownloader implements Downloader {
  async download(png: Blob, filename: string, saveAs: boolean): Promise<void> {
    const url = URL.createObjectURL(png);
    try {
      await chrome.downloads.download({ url, filename, saveAs, conflictAction: 'uniquify' });
    } finally {
      // The download may still be reading the blob after the call resolves.
      setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS);
    }
  }
}
