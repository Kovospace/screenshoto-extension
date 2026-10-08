const DARK = '#111827';
const LIGHT = '#ffffff';

/** Dark or white, whichever reads better on `hex` (#rrggbb) — for text outlines and step numbers. */
export function contrastingInk(hex: string): typeof DARK | typeof LIGHT {
  const n = parseInt(hex.slice(1), 16);
  const luma = (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255;
  return luma > 0.62 ? DARK : LIGHT;
}

export const INK = { DARK, LIGHT } as const;
