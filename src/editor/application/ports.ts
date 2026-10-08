/*
 * What the editor's application layer needs from the outside (implemented in ../ui and
 * ../infrastructure, faked in tests).
 */
import type { TextAnnotation } from '../../shared/model/Annotation';
import type { Scale } from '../../shared/model/Capture';
import type { SizeKey } from '../config/editorConfig';
import type { Cursor, ToolName } from '../domain/ToolName';

/** Everything the editor shows. Passive: it never changes editor state itself. */
export interface EditorView {
  /** Repaints the canvas from the current scene. */
  render(): void;
  showTool(tool: ToolName): void;
  showColor(color: string): void;
  showSize(size: SizeKey): void;
  /** Switches the canvas to the scale's image size and updates the scale buttons/labels. */
  showScale(scale: Scale): void;
  showControls(controls: { canUndo: boolean; canRedo: boolean; hasSelection: boolean }): void;
  setCursor(cursor: Cursor): void;
}

export interface Notifier {
  toast(message: string): void;
}

/** A text box placed over a text annotation. */
export interface TextInput {
  readonly value: string;
  remove(): void;
}

export interface TextInputListener {
  /** Enter (without Shift), or focus left the box. */
  onCommit(): void;
  /** Escape. */
  onCancel(): void;
}

export interface TextInputFactory {
  open(a: TextAnnotation, zoom: number, listener: TextInputListener): TextInput;
}

export interface Downloader {
  /** Saves under the Downloads folder; rejects with a message containing "cancel" when the user cancels Save As. */
  download(png: Blob, filename: string, saveAs: boolean): Promise<void>;
}

export interface ClipboardWriter {
  /** Accepts a promise so the clipboard write starts within the user gesture. */
  writePng(png: Promise<Blob>): Promise<void>;
}

/** Renders the annotated image of one scale. */
export interface ImageExporter {
  render(scale: Scale): Promise<Blob>;
}

export interface Autosaver {
  /** Persists the current annotations soon; repeated calls coalesce. */
  schedule(): void;
}
