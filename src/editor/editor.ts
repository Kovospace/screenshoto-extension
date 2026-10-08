/*
 * Editor page entry point and composition root (editor.html#<captureId>): loads the capture,
 * builds the object graph, connects it to the DOM. No logic lives here.
 */
import { IndexedDbCaptureRepository } from '../shared/persistence/IndexedDbCaptureRepository';
import { DebouncedAutosaver } from './application/DebouncedAutosaver';
import { Editor } from './application/Editor';
import { ExportService } from './application/ExportService';
import { hostOf } from './application/fileName';
import { ShapeRegistry } from './domain/shapes/ShapeRegistry';
import { BrowserClipboard } from './infrastructure/BrowserClipboard';
import { CanvasImageExporter } from './infrastructure/CanvasImageExporter';
import { ChromeDownloader } from './infrastructure/ChromeDownloader';
import { loadCapture } from './infrastructure/loadCapture';
import { PointerController } from './interaction/PointerController';
import { AnnotationScene } from './model/AnnotationScene';
import { EditorState } from './model/EditorState';
import { History } from './model/History';
import { CanvasTextMeasurer } from './rendering/CanvasTextMeasurer';
import { SceneRenderer } from './rendering/SceneRenderer';
import { bindCanvasPointer } from './ui/CanvasPointerInput';
import { CanvasStage } from './ui/CanvasStage';
import { DomEditorView } from './ui/DomEditorView';
import { EditorDom } from './ui/EditorDom';
import { KeyboardShortcuts } from './ui/KeyboardShortcuts';
import { TextAreaInputFactory } from './ui/TextAreaInputFactory';
import { Toast } from './ui/Toast';
import { Toolbar } from './ui/Toolbar';

const dom = new EditorDom();

start().catch(e => dom.showFatal(e?.message || String(e)));

async function start(): Promise<void> {
  const repository = new IndexedDbCaptureRepository();
  const session = await loadCapture(decodeURIComponent(location.hash.slice(1)), repository);
  const { capture } = session;

  // All annotation geometry is in 1× (CSS pixel) units, so it renders identically at every scale.
  const state = new EditorState(session.initialScale());
  const scene = new AnnotationScene(capture.annotations || []);
  const shapes = new ShapeRegistry(new CanvasTextMeasurer());
  const renderer = new SceneRenderer(shapes);

  const toolbar = new Toolbar(dom);
  const stage = new CanvasStage(dom, session, state, scene, renderer);
  const view = new DomEditorView(toolbar, stage, session, state);
  const exporter = new ExportService(
    capture,
    new CanvasImageExporter(session, () => scene.annotations, renderer),
    new ChromeDownloader(),
    new BrowserClipboard(),
    new Toast(dom.toast),
  );
  const autosaver = new DebouncedAutosaver(repository, session.id,
    () => ({ annotations: scene.toArray(), lastScale: state.scale }));

  const editor = new Editor({
    session, state, scene, shapes, view, autosaver, exporter,
    history: new History(),
    textInputs: new TextAreaInputFactory(dom.wrap),
  });

  document.title = `ShotKit — ${capture.title || hostOf(capture.url)}`;
  toolbar.bind(editor, session);
  view.showColor(state.color);
  view.showSize(state.size);
  editor.refreshControls();
  editor.setTool(state.tool);
  editor.setScale(state.scale, true);
  view.layout();
  window.addEventListener('resize', () => view.layout());

  bindCanvasPointer(dom.canvas, stage, new PointerController(editor));
  window.addEventListener('keydown', new KeyboardShortcuts(editor).onKeyDown);
}
