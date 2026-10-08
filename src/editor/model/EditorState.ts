import type { Scale } from '../../shared/model/Capture';
import { DEFAULTS, type SizeKey } from '../config/editorConfig';
import type { ToolName } from '../domain/ToolName';

/** The user's current choices in the toolbar, and the on-screen zoom. */
export class EditorState {
  tool: ToolName = DEFAULTS.tool;
  color: string = DEFAULTS.color;
  size: SizeKey = DEFAULTS.size;
  scale: Scale;
  /** Screen px per 1× px of the canvas as laid out (fit to window, ≤ 3). */
  zoom = 1;

  constructor(scale: Scale) {
    this.scale = scale;
  }
}
