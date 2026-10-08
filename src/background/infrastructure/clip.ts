import type { PageRect } from '../../shared/model/Geometry';

/** CDP `Page.Viewport` clip. */
export interface Clip extends PageRect {
  scale: number;
}

/**
 * Snaps a fractional page rect outwards to whole CSS pixels, so the screenshot never cuts into
 * the selection, never starts at a negative coordinate and is never empty.
 * `scale: 1` because the device scale factor already provides the density.
 */
export function toClip(r: PageRect): Clip {
  const x = Math.max(0, Math.floor(r.x));
  const y = Math.max(0, Math.floor(r.y));
  return {
    x,
    y,
    width: Math.max(1, Math.ceil(r.x + r.width) - x),
    height: Math.max(1, Math.ceil(r.y + r.height) - y),
    scale: 1,
  };
}
