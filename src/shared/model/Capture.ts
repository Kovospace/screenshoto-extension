import type { Annotation } from './Annotation';
import type { PageRect } from './Geometry';

/** Device pixel ratios a capture is rendered at. */
export type Scale = 1 | 2 | 3 | 4;
export const SCALES: readonly Scale[] = [1, 2, 3, 4];

export const isScale = (n: number): n is Scale => (SCALES as readonly number[]).includes(n);

/** Captures older than this are pruned (the editor's "no longer stored" message names the same 7 days). */
export const CAPTURE_RETENTION_MS = 7 * 24 * 3600 * 1000;

export type CaptureId = string;

/**
 * One capture, as stored in IndexedDB. Written by the service worker, then patched by the editor
 * (`annotations`, `lastScale`). Field names are the persisted format — do not rename.
 */
export interface Capture {
  /** PNG per scale; a scale Chrome could not render is absent and listed in `failed`. */
  images: Partial<Record<Scale, Blob>>;
  failed: Scale[];
  /** Captured region in page CSS pixels. */
  rect: PageRect;
  url?: string;
  title?: string;
  /** Epoch millis of the capture. */
  time: number;
  annotations?: Annotation[];
  lastScale?: Scale;
}

/** The part of a capture the editor writes back. */
export type CaptureEdits = Pick<Capture, 'annotations' | 'lastScale'>;
