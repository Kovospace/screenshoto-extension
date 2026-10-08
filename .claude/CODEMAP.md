# Code map

Concern → file, so nobody lists the tree to find out. Paths relative to `src/`; tests mirror
them under `test/`. Every file is under ~210 lines: read whole files, no ranges needed.
**Keep it current:** a new module or concern adds a row.

## Cross-context

| Concern | File |
|---|---|
| Stored capture record, scales `1..4`, 7-day retention | `shared/model/Capture.ts` |
| Annotation types (persisted shape) | `shared/model/Annotation.ts` |
| `PageRect` / `ViewportRect` / `Point` | `shared/model/Geometry.ts` |
| Picker → worker message | `shared/messaging/CaptureRequest.ts` |
| `window.__screenshotoPicker` / `__screenshotoEl` typing | `shared/messaging/pageGlobals.ts` |
| Capture storage interface / IndexedDB impl | `shared/persistence/CaptureRepository.ts`, `IndexedDbCaptureRepository.ts` |
| Manifest, permissions, Alt+Shift+S, icons | `../public/manifest.json`, `../public/icons/` |
| Build (3 bundles + static copy; `--release` = no source maps), zips | `../scripts/build.mjs`, `../scripts/package.mjs` |
| Chrome Web Store: listing texts, permission justifications, publishing steps, privacy policy, graphics | `../store/chrome-web-store-listing.md`, `../store/privacy-policy.md`, `../store/materials/`, `../store/render-graphics.mjs` |

## Service worker — `background/`

| Concern | File |
|---|---|
| Wiring, `action.onClicked`, context menu clicks, `runtime.onMessage`, blocked-page message | `background.ts` |
| Context menu entries "Capture area" / "Capture element" | `infrastructure/CaptureContextMenu.ts` |
| Capture use case (scale loop, failed scales, element re-measure, save, open editor) | `application/CaptureService.ts` |
| Port interfaces | `application/ports.ts` |
| DPR re-render + screenshot via `chrome.debugger` / CDP, settle wait | `infrastructure/DebuggerPageRenderer.ts` |
| Clip snapping, base64 → Blob | `infrastructure/clip.ts`, `infrastructure/base64.ts` |
| Re-measuring the picked element in the page | `infrastructure/ScriptingElementLocator.ts` |
| Badge `…` / red `!` + tooltip | `infrastructure/ActionBadgeIndicator.ts` |
| Injecting the picker (with a requested mode), opening the editor tab | `infrastructure/ScriptingPickerLauncher.ts`, `infrastructure/TabEditorLauncher.ts` |

## Picker — `picker/`

| Concern | File |
|---|---|
| Entry; toggle vs. open-in-mode on re-injection | `picker.ts`, `launchPicker.ts` |
| Session: listeners, keys (Esc/R/E), finish → message | `PickerController.ts` |
| Overlay DOM + CSS (closed shadow root), size label, handles, 📷 button | `PickerOverlay.ts` |
| Region: drag (min 4 px), then adjust and confirm (📷 / Enter) | `modes/RegionMode.ts`; handle/resize/move geometry `regionAdjust.ts` |
| Element hover, ↑↓, click/Enter | `modes/ElementMode.ts`; interface `modes/SelectionMode.ts` |
| Parent/child walk | `ElementTrail.ts` |

## Editor — `editor/`

| Concern | File |
|---|---|
| Wiring, startup order | `editor.ts` |
| Page markup / styles | `editor.html`, `editor.css` |
| Colours, S/M/L presets, fonts, shortcuts, tolerances, timings | `config/editorConfig.ts` |
| All commands; undo/redraw/save/refresh choreography | `application/Editor.ts` (`EditorCommands.ts` = UI-facing interface) |
| Port interfaces (view, text input, downloader, clipboard, exporter, autosaver) | `application/ports.ts` |
| Save / Save all / Copy + toasts | `application/ExportService.ts` |
| Download file name `<folder>/<host>_<time><suffix>.png` | `application/fileName.ts` |
| Export settings (folder in Downloads, `{n}` suffix): model + validation, service, chrome.storage.sync, ⚙ dialog | `model/ExportSettings.ts`, `application/SettingsService.ts`, `infrastructure/ChromeStorageSettingsRepository.ts`, `ui/SettingsDialog.ts` (markup in `editor.html`) |
| Debounced write-back of annotations + last scale | `application/DebouncedAutosaver.ts` |
| Text box commit/cancel/empty rules | `application/TextEditSession.ts` |
| Shapes: draw, bounds, hit-test, handles, size | `domain/shapes/*Shape.ts`, `ShapeBehavior.ts`, `ShapeRegistry.ts` |
| Geometry (span box, segment distance, Shift constraint, translate) | `domain/geometry.ts` |
| Contrasting ink colour | `domain/color.ts` |
| Tool names, idle cursors | `domain/ToolName.ts` |
| Press priority (text box → handle → selected shape → tool), hover cursor, dblclick | `interaction/PointerController.ts` |
| Gestures: create / move / handle drag | `interaction/drags.ts` |
| What each tool does on a press | `interaction/tools/*Tool.ts` |
| Hit-testing with zoom-independent tolerance | `interaction/HitTester.ts` |
| Annotations + selection + editing; snapshots | `model/AnnotationScene.ts` |
| Undo/redo stacks (limit 200) | `model/History.ts` |
| Tool/colour/size/scale/zoom | `model/EditorState.ts` |
| Capture + decoded images, 1× base size, initial scale | `model/LoadedCapture.ts`; loading + fatal messages `infrastructure/loadCapture.ts` |
| Painting view / export | `rendering/SceneRenderer.ts`; off-screen PNG `infrastructure/CanvasImageExporter.ts` |
| Toolbar buttons ↔ commands, button states | `ui/Toolbar.ts` |
| Canvas sizing, fit-to-window zoom, client → 1× mapping, cursor | `ui/CanvasStage.ts` |
| Keyboard shortcuts | `ui/KeyboardShortcuts.ts` |
| Canvas pointer events → controller | `ui/CanvasPointerInput.ts` |
| Text `<textarea>` overlay | `ui/TextAreaInputFactory.ts` |
| Toast, fatal screen, element lookup | `ui/Toast.ts`, `ui/EditorDom.ts` |

## Tests

| What | File |
|---|---|
| Editor on fakes (`drag`, `click`, fake view/autosaver/text box) | `../test/support/editorHarness.ts` |
| fake-indexeddb setup | `../test/support/setup.ts` |
| Real-Chrome e2e + `--json` observation dump | `../test-e2e/run.mjs`, page `../test-e2e/fixture.html` |
