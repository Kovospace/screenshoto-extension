# CLAUDE.md

Screenshoto Web: a Chrome MV3 extension that captures a page region or element at **true** 1×–4×
(re-rendered through the DevTools protocol, not upscaled), lets you annotate it, and saves or
copies it. TypeScript, no framework, no runtime dependencies, no network requests.

**The feature set is deliberately complete.** Do not add features, options or "improvements"
unless asked. A refactoring must change nothing a user can observe (see *Proving a change
changed nothing*).

## Commands

```bash
npm install
npm run build        # typecheck + bundle into dist/ (load dist/ via chrome://extensions → Load unpacked)
npm run watch        # rebuild TS on change (static files are copied once); reload the extension after
npm test             # unit tests (Vitest, jsdom) — fast, run after every change
npm run test:e2e     # build + drive the real extension in headless Chrome for Testing (~40 s)
npm run typecheck
npm run package      # build + screenshoto-web.zip (folder "screenshoto-web", no source maps)
```

## Architecture

Three extension contexts, each with its own entry point and composition root; they share only
`src/shared/`. Inside each, layers depend inwards only:
**entry → ui/infrastructure (adapters) → application → domain/model**, and adapters are reached
through interfaces (`ports.ts`) so the core is unit-testable without Chrome or a DOM.

```
toolbar click / context menu ──► background (service worker)
                   ├─ injects picker.js into the tab ──► picker (content script, classic IIFE)
                   │                                      user drags + adjusts a region (📷/Enter) / picks an element
                   │◄──────── CaptureRequest message ─────┘
                   ├─ CaptureService: debugger re-renders the tab at DPR 1..4, screenshots each
                   ├─ saves Capture to IndexedDB (shared/persistence)
                   └─ opens editor.html#<id> ──► editor (extension page)
                                                  loads Capture, annotates, autosaves edits back,
                                                  exports PNGs (downloads / clipboard)
```

| Context | Entry (composition root) | Core | Adapters |
|---|---|---|---|
| Service worker | `src/background/background.ts` | `application/CaptureService.ts` + `application/ports.ts` | `infrastructure/*` (debugger, scripting, action badge, tabs) |
| Picker | `src/picker/picker.ts` → `launchPicker.ts` | `PickerController.ts`, `modes/*`, `regionAdjust.ts`, `ElementTrail.ts` | `PickerOverlay.ts` (shadow-DOM view) |
| Editor | `src/editor/editor.ts` | `application/Editor.ts` (+ `ports.ts`), `interaction/*`, `model/*`, `domain/*` | `ui/*` (DOM), `infrastructure/*` (Chrome, canvas), `rendering/*` |

### Design patterns (Java names, so you can find your way)

| Pattern | Where |
|---|---|
| Ports & adapters / DI by constructor | every `ports.ts` interface; wiring only in the three entry files |
| Repository | `shared/persistence/CaptureRepository` ← `IndexedDbCaptureRepository` |
| Strategy + registry | `editor/domain/shapes/*Shape` behind `ShapeBehavior`, looked up via `ShapeRegistry.of(a)` — **never `switch (a.type)`** |
| Template method | `StrokedShape.draw` (stroke + shadow) → subclass `paint` |
| Strategy (tools) | `interaction/tools/*Tool` behind `DrawingTool`, keyed by `ToolName` in `PointerController` |
| State | `interaction/drags.ts` (gesture in progress); `picker/modes/*` (region vs element) |
| Memento | `AnnotationScene.snapshot()/restore()` + `model/History` |
| Facade / Mediator | `editor/application/Editor` — all commands; implements `EditorCommands` (for UI) and `InteractionContext` (for gestures) — interface segregation |
| Passive view | `EditorView` → `ui/DomEditorView` (never mutates state) |

Rule inside `Editor` for every mutation: **record undo *before* changing → redraw → schedule save
→ refresh controls.**

## Invariants — do not break

- **Persisted formats.** IndexedDB `shotkit` v1, store `captures`, out-of-line keys
  (`IndexedDbCaptureRepository`); field names of `Capture` and `Annotation`
  (`shared/model/*`) including the terse `w`, `r`, `n`. Captures live 7 days; renaming orphans them.
- **Annotation geometry is in 1× CSS px**, rendered at any scale by `ctx.setTransform(f…)`
  where `f = image px / 1× px`. Pointer tolerances are screen px divided by `state.zoom`.
- **`picker.js` must stay a self-contained classic script** (esbuild `format: 'iife'`). It is
  injected with `executeScript({ files })`. Re-injected from the toolbar it toggles (cancels) an
  open picker; from the context menu the worker first sets `window.__screenshotoRequestedMode`
  and the picker opens in, or switches to, that mode (`launchPicker.ts`).
- **The IndexedDB name stays `shotkit`** (the extension's former name) — renaming orphans captures.
- **Functions passed to `executeScript({ func })` are serialised**: no imports, no closures —
  see `ScriptingElementLocator.measurePickedElement`. Page globals are typed in
  `shared/messaging/pageGlobals.ts` (`__screenshotoPicker`, `__screenshotoEl`).
- **The worker keeps no state between events** (MV3 kills idle workers).
- Every user-visible string (toasts, fatal messages, tooltips, the README key table) is
  behaviour. The e2e test asserts many of them.
- Constants live in `editor/config/editorConfig.ts`; magic numbers elsewhere get a named const.

## Tests

- **Unit** — `test/` mirrors `src/` (`test/editor/model/History.test.ts` ↔
  `src/editor/model/History.ts`). `test/support/editorHarness.ts` builds a real `Editor` +
  `PointerController` on fakes (no DOM/canvas), with `drag()/click()/shiftDrag()` in 1× units.
  IndexedDB is `fake-indexeddb`. Canvas painting is not unit-tested (jsdom has no 2D context) —
  the e2e test covers it by pixel hash.
- **E2E** — `test-e2e/run.mjs` installs the build into Chrome for Testing (Puppeteer),
  clicks the toolbar action, drags/picks, edits, saves (to a temp profile's download folder),
  reloads, and asserts. `--ext <dir>` tests any unpacked build; `--json <file>` dumps every
  observation (UI state, canvas hashes, stored records, PNG hashes).
- **A regression test must fail against the bug it names.** Check by reverting the fix.

### Proving a change changed nothing

Run the e2e suite with `--json` on the old build and the new one and `diff` the files — the
`verify-change` skill does exactly this. The TypeScript rewrite of the original JS was accepted
this way: all observations byte-identical.

## Known behaviour and fixes since the original JS

- With several files saved and one failing, the toast still names the first *requested* scale
  (`ExportService.save`).
- Deliberate fix in the rewrite: a click-sized shape discarded at pointer-up removes *itself*;
  the original popped the last annotation, which after Ctrl+Z mid-drag was a different one.
- Fixed (approved): a click with the Text tool closed the new text box at once — the browser's
  default `mousedown` on the unfocusable canvas moved focus to `<body>`. `CanvasPointerInput`
  now cancels the default of a `pointerdown` that opened a text box.

## Code style

TypeScript strict, ES2022, `verbatimModuleSyntax` (use `import type`). Classes for things with
behaviour or state, plain functions for pure helpers. PascalCase file per class/interface,
camelCase for function modules. Comments say *why*; JSDoc on public members of ports and core
classes. No new dependencies without asking.

## Where things are

@.claude/CODEMAP.md
