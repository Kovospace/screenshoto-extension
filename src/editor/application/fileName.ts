import type { Capture, Scale } from '../../shared/model/Capture';
import { DOWNLOAD_FOLDER } from '../config/editorConfig';

export function hostOf(url: string | undefined): string {
  try {
    return new URL(url!).hostname;
  } catch {
    return 'capture';
  }
}

/** `Screenshoto Web/<host>_<YYYY-MM-DD_HH-MM-SS>@<scale>x.png`, from the capture's local time. */
export function exportFileName(capture: Pick<Capture, 'time' | 'url'>, scale: Scale, now = Date.now()): string {
  const d = new Date(capture.time || now);
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  const host = hostOf(capture.url).replace(/[^\w.-]+/g, '_') || 'capture';
  return `${DOWNLOAD_FOLDER}/${host}_${stamp}@${scale}x.png`;
}
