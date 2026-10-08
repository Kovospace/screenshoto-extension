/** Every tunable of the editor in one place. Units are 1× CSS pixels unless stated. */
import type { Scale } from '../../shared/model/Capture';
import type { ToolName } from '../domain/ToolName';

export const COLORS = ['#e5243b', '#ff7a00', '#ffcc00', '#16a34a', '#2563eb', '#111827', '#ffffff'] as const;

export type SizeKey = 'S' | 'M' | 'L';

/** What the S/M/L buttons mean for each kind of annotation. */
export interface SizePreset {
  /** Stroke width of rectangles, ellipses and arrows. */
  stroke: number;
  /** Font size of text. */
  fontSize: number;
  /** Radius of step markers. */
  radius: number;
}

export const SIZE_PRESETS: Readonly<Record<SizeKey, SizePreset>> = {
  S: { stroke: 2, fontSize: 14, radius: 11 },
  M: { stroke: 4, fontSize: 18, radius: 14 },
  L: { stroke: 7, fontSize: 26, radius: 19 },
};

export const FONT_FAMILY = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
export const TEXT_FONT_WEIGHT = 600;
export const TEXT_LINE_HEIGHT = 1.25;

/** Single-key tool shortcuts (lower-case). */
export const TOOL_SHORTCUTS: Readonly<Record<string, ToolName>> = {
  v: 'select', r: 'rect', o: 'ellipse', a: 'arrow', t: 'text', n: 'step',
};

export const DEFAULTS = {
  tool: 'arrow' as ToolName,
  color: COLORS[0] as string,
  size: 'M' as SizeKey,
  /** Opened scale when the capture has no remembered one (and 2× exists). */
  scale: 2 as Scale,
};

export const HISTORY_LIMIT = 200;
export const AUTOSAVE_DELAY_MS = 300;
export const TOAST_VISIBLE_MS = 2200;
/** Object URLs handed to chrome.downloads stay valid this long. */
export const DOWNLOAD_URL_LIFETIME_MS = 60_000;

/** Screen-pixel distances; divided by the view zoom so they feel the same at any zoom. */
export const POINTER = {
  hitTolerance: 6,
  handleTolerance: 7,
  /** Shorter drags do not create a shape. */
  minShapeLength: 4,
  /** Half the side of a drawn resize handle. */
  handleRadius: 4.5,
};

export const NUDGE = { step: 1, shiftStep: 10 };

export const VIEW = { padding: 32, minZoom: 0.05, maxZoom: 3 };
