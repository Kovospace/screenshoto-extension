import { CAPTURE_RETENTION_MS, SCALES, type CaptureId, type Scale } from '../../shared/model/Capture';
import type { CaptureRepository } from '../../shared/persistence/CaptureRepository';
import { LoadedCapture } from '../model/LoadedCapture';

/** A reason the editor cannot open; the message is shown to the user as-is. */
export class EditorLoadError extends Error {}

const RETENTION_DAYS = CAPTURE_RETENTION_MS / (24 * 3600 * 1000);

/** Reads the capture named in the editor URL and decodes its images. */
export async function loadCapture(id: CaptureId, repository: CaptureRepository): Promise<LoadedCapture> {
  if (!id) throw new EditorLoadError('Nothing to edit — start a capture from the toolbar button.');
  const capture = await repository.find(id);
  if (!capture) throw new EditorLoadError(`This capture is no longer stored. Captures are kept for ${RETENTION_DAYS} days.`);
  const images: Partial<Record<Scale, HTMLImageElement>> = {};
  for (const s of SCALES) {
    const blob = capture.images?.[s];
    if (blob) images[s] = await decodeImage(blob);
  }
  if (!Object.keys(images).length) throw new EditorLoadError('The capture contains no images.');
  return new LoadedCapture(id, capture, images);
}

function decodeImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = URL.createObjectURL(blob);
  });
}
