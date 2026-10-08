import type { TwoPointType } from '../../shared/model/Annotation';

export type ToolName = 'select' | TwoPointType | 'text' | 'step';

export type Cursor = 'default' | 'text' | 'crosshair' | 'move' | 'handle';

/** The idle cursor of a tool (when not hovering something it can grab). */
export function toolCursor(tool: ToolName): Cursor {
  return tool === 'select' ? 'default' : tool === 'text' ? 'text' : 'crosshair';
}
