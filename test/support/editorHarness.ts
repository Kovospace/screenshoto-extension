/*
 * An Editor wired to in-memory fakes: no DOM, no canvas, no Chrome. Geometry is in 1× units and
 * the zoom is 1 unless a test changes `state.zoom`.
 */
import type { Annotation } from '../../src/shared/model/Annotation';
import type { Capture, Scale } from '../../src/shared/model/Capture';
import { Editor } from '../../src/editor/application/Editor';
import type { ExportService } from '../../src/editor/application/ExportService';
import type { Autosaver, EditorView, TextInput, TextInputFactory, TextInputListener } from '../../src/editor/application/ports';
import { ShapeRegistry } from '../../src/editor/domain/shapes/ShapeRegistry';
import type { TextMeasurer } from '../../src/editor/domain/TextMeasurer';
import { PointerController } from '../../src/editor/interaction/PointerController';
import { AnnotationScene } from '../../src/editor/model/AnnotationScene';
import { EditorState } from '../../src/editor/model/EditorState';
import { History } from '../../src/editor/model/History';
import { LoadedCapture } from '../../src/editor/model/LoadedCapture';

/** Every character is 10 px wide. */
export const fixedWidthMeasurer: TextMeasurer = { width: text => text.length * 10 };

export function fakeImage(width: number, height: number): HTMLImageElement {
  return { naturalWidth: width, naturalHeight: height } as HTMLImageElement;
}

/** A 200×100 capture available at the given scales. */
export function loadedCapture(scales: Scale[] = [1, 2, 3, 4], extra: Partial<Capture> = {}): LoadedCapture {
  const images: Partial<Record<Scale, HTMLImageElement>> = {};
  for (const s of scales) images[s] = fakeImage(200 * s, 100 * s);
  const capture: Capture = {
    images: Object.fromEntries(scales.map(s => [s, new Blob([`png@${s}`])])),
    failed: [], rect: { x: 0, y: 0, width: 200, height: 100 }, time: 0, ...extra,
  };
  return new LoadedCapture('cap-1', capture, images);
}

export class FakeView implements EditorView {
  renders = 0;
  calls: string[] = [];
  controls = { canUndo: false, canRedo: false, hasSelection: false };
  cursor = '';
  render() { this.renders++; }
  showTool(t: string) { this.calls.push(`tool:${t}`); }
  showColor(c: string) { this.calls.push(`color:${c}`); }
  showSize(s: string) { this.calls.push(`size:${s}`); }
  showScale(s: number) { this.calls.push(`scale:${s}`); }
  showControls(c: FakeView['controls']) { this.controls = c; }
  setCursor(c: string) { this.cursor = c; }
}

export class FakeAutosaver implements Autosaver {
  scheduled = 0;
  schedule() { this.scheduled++; }
}

/** A text box the tests type into and close by hand. */
export class FakeTextInput implements TextInput {
  removed = false;
  constructor(public value: string, readonly zoom: number, private readonly listener: TextInputListener) {}
  type(text: string) { this.value = text; }
  pressEnter() { this.listener.onCommit(); }
  pressEscape() { this.listener.onCancel(); }
  blur() { this.listener.onCommit(); }
  remove() { this.removed = true; }
}

export interface Harness {
  editor: Editor;
  pointer: PointerController;
  view: FakeView;
  autosaver: FakeAutosaver;
  texts: FakeTextInput[];
  exporter: { save: ReturnType<typeof recorder>; copy: ReturnType<typeof recorder> };
  scene: AnnotationScene;
  state: EditorState;
  /** Press, optionally drag through points, release — at zoom 1 in 1× units. */
  drag(from: [number, number], ...to: Array<[number, number]>): void;
  click(at: [number, number]): void;
  shiftDrag(from: [number, number], to: [number, number]): void;
}

function recorder() {
  const calls: unknown[][] = [];
  const fn = (...args: unknown[]) => { calls.push(args); return Promise.resolve(); };
  return Object.assign(fn, { calls });
}

export function editorHarness(options: { annotations?: Annotation[]; scales?: Scale[] } = {}): Harness {
  const session = loadedCapture(options.scales);
  const state = new EditorState(session.initialScale());
  const scene = new AnnotationScene(options.annotations ?? []);
  const view = new FakeView();
  const autosaver = new FakeAutosaver();
  const texts: FakeTextInput[] = [];
  const textInputs: TextInputFactory = {
    open: (a, zoom, listener) => {
      const input = new FakeTextInput(a.text, zoom, listener);
      texts.push(input);
      return input;
    },
  };
  const exporter = { save: recorder(), copy: recorder() };
  const editor = new Editor({
    session, state, scene, view, autosaver, textInputs,
    history: new History(),
    shapes: new ShapeRegistry(fixedWidthMeasurer),
    exporter: exporter as unknown as ExportService,
  });
  const pointer = new PointerController(editor);
  const press = (p: [number, number], shift = false) => {
    if (pointer.shouldCapture()) pointer.press({ point: { x: p[0], y: p[1] }, shift });
  };
  const move = (p: [number, number], shift = false) => pointer.move({ point: { x: p[0], y: p[1] }, shift });
  return {
    editor, pointer, view, autosaver, texts, exporter, scene, state,
    drag(from, ...to) { press(from); for (const p of to) move(p); pointer.release(); },
    click(at) { press(at); pointer.release(); },
    shiftDrag(from, to) { press(from, true); move(to, true); pointer.release(); },
  };
}
