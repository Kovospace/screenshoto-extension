---
name: add-annotation-tool
description: Checklist for adding a new annotation shape/tool to the ShotKit editor (e.g. highlighter, blur, line), or changing how an existing shape draws, hit-tests or resizes. Use whenever a task touches annotation types, editor tools or their shortcuts.
---

# Adding an annotation tool

Only when the user asked for it — the feature set is intentionally closed (CLAUDE.md).

The design keeps this open/closed: one new Strategy class plus registrations. Touch points, in order:

1. **Persisted type** — `src/shared/model/Annotation.ts`: add an interface to the `Annotation`
   union. If it is defined by two points, add its name to `TwoPointAnnotation['type']`
   instead (then `isTwoPoint`, `translate`, handles and Shift-constrain work automatically).
   Field names become a stored format: choose them for good.
2. **Behaviour** — `src/editor/domain/shapes/<Name>Shape.ts` implementing `ShapeBehavior`
   (`draw`, `bounds`, `hitTest`, `handles`, `framedWhenSelected`, `applySize`).
   Outlined two-point shapes extend `StrokedShape` and implement only `paint` + `hitTest`.
   Draw in 1× units; for anything shadow/blur-like multiply by `ctx.getTransform().a`.
3. **Register** — `ShapeRegistry` constructor (the mapped type makes a missing entry a compile error).
4. **Tool** — `src/editor/domain/ToolName.ts` (`ToolName`, and `toolCursor` if needed);
   a `DrawingTool` in `src/editor/interaction/tools/` unless `ShapeTool` (drag-out) fits;
   add it to the `tools` map in `PointerController` (also a compile error if missing).
   If Shift should constrain differently, extend `constrainEnd` in `domain/geometry.ts`.
5. **Shortcut & presets** — `TOOL_SHORTCUTS` and, if sized, `SizePreset` in
   `src/editor/config/editorConfig.ts`. Check the key is free (`1-4`, `v r o a t n`, Delete,
   Backspace, Escape, arrows are taken).
6. **Toolbar** — a `<button data-tool="…">` with an inline 24×24 stroke SVG in `src/editor/editor.html`.
7. **Docs** — README key table; CODEMAP row.
8. **Tests** — `test/editor/domain/shapes/shapes.test.ts` (hit-test edges, bounds, size);
   `test/editor/interaction/PointerController.test.ts` (create via `editorHarness`, undo);
   an e2e edit step in `test-e2e/run.mjs` (draw it, then check saved PNGs still come out).
9. Run the `verify-change` skill (not the compare step — this is a behaviour change, but the
   compare output should list only the new step's observations).
