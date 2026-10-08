import type { Scale } from '../../shared/model/Capture';
import type { SizeKey } from '../config/editorConfig';
import type { ToolName } from '../domain/ToolName';

/** The user-facing commands of the editor, as bound to toolbar buttons and keyboard shortcuts. */
export interface EditorCommands {
  setTool(tool: ToolName): void;
  setScale(scale: Scale): void;
  setColor(color: string): void;
  setSize(size: SizeKey): void;
  undo(): void;
  redo(): void;
  deleteSelection(): void;
  deselect(): void;
  /** Moves the selected annotation by (dx, dy) 1× px, if there is one. */
  nudgeSelection(dx: number, dy: number): void;
  hasSelection(): boolean;
  isEditingText(): boolean;
  /** Saves the current scale; `saveAs` asks for a location. */
  saveCurrent(saveAs: boolean): void;
  /** Saves every available scale. */
  saveAll(): void;
  copy(): void;
}
