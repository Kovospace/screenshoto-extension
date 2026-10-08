import type { Capture, Scale } from '../../shared/model/Capture';
import { SCALE_TOKEN, type ExportSettings } from '../model/ExportSettings';

export function hostOf(url: string | undefined): string {
  try {
    return new URL(url!).hostname;
  } catch {
    return 'capture';
  }
}

/**
 * `<folder>/<host>_<YYYY-MM-DD_HH-MM-SS><suffix>.png` (relative to Downloads), from the capture's
 * local time; `{n}` in the suffix becomes the scale. Defaults: `Screenshoto Web/…@2x.png`.
 */
export function exportFileName(capture: Pick<Capture, 'time' | 'url'>, scale: Scale, settings: ExportSettings, now = Date.now()): string {
  const d = new Date(capture.time || now);
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  const host = hostOf(capture.url).replace(/[^\w.-]+/g, '_') || 'capture';
  const name = `${host}_${stamp}${settings.suffix.replaceAll(SCALE_TOKEN, String(scale))}.png`;
  return settings.folder ? `${settings.folder}/${name}` : name;
}
