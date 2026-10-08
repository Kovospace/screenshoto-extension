# ShotKit

Capture a region or an HTML element at **true** 1×, 2×, 3× and 4× resolution, annotate it, and save it. No accounts, no paywall, no network requests.

## Install (2 minutes)

1. Unzip `shotkit.zip` somewhere permanent (Chrome loads it from that folder).
   Building from source instead? `npm install && npm run build` and use the `dist` folder.
2. Open `chrome://extensions`, switch on **Developer mode** (top right).
3. Click **Load unpacked** and pick the `shotkit` (or `dist`) folder.
4. Pin the ShotKit icon to the toolbar.

## Use

- Click the icon or press **Alt+Shift+S**.
  - **Region:** drag a rectangle.
  - **Element** (press **E**): hover, **↑/↓** to go to the parent/child element, then click or press Enter.
  - **Esc** cancels.
- The editor opens in a new tab with all four scales rendered.

### Editor keys

| Key | Action |
|---|---|
| 1 – 4 | Switch scale |
| V R O A T N | Select, Rectangle, Ellipse, Arrow, Text, Numbered step |
| Shift while drawing | Square / circle / 45° arrow |
| Double-click text | Edit it |
| Del | Delete selected |
| Arrows | Nudge (Shift = 10 px) |
| Ctrl+Z / Ctrl+Shift+Z | Undo / redo |
| Ctrl+C | Copy current scale |
| Ctrl+S | Save current scale (Shift = choose location) |

Files go to `Downloads/ShotKit/<site>_<date>@2x.png`. **Save all** writes all four scales. Annotations are stored in 1× units, so they look identical at every scale.

## How the "real" 2×–4× works

The page is re-rendered at each device pixel ratio through Chrome's DevTools protocol (`Emulation.setDeviceMetricsOverride`), the same way DevTools' own screenshots work. Text, SVG and CSS are rasterised sharp, and `srcset` images load their high-density versions. Bitmap images that only exist at low resolution stay low resolution.

While the capture runs (about a second), Chrome shows a *"ShotKit started debugging this browser"* bar. That bar is Chrome's mandatory notice for this API, and it disappears on its own.

## Limits

- Chrome lets no extension run on `chrome://` pages, the built-in New Tab page, or the Chrome Web Store. The icon shows a red **!** there.
- Very large regions at 4× can exceed Chrome's maximum texture size. That scale is greyed out in the editor, and the others still work.
- Captures are kept for 7 days, so you can reopen the editor tab and keep annotating.

## Development

TypeScript, bundled by esbuild into `dist/` (three independent bundles: service worker, picker
content script, editor page). Requires Node 20+.

```bash
npm install            # also fetches Chrome for Testing for the e2e tests
npm run build          # typecheck + build dist/  (then reload the extension in chrome://extensions)
npm run watch          # rebuild on change
npm test               # unit tests (Vitest)
npm run test:e2e       # drive the real extension in headless Chrome
npm run compare -- main  # prove a refactor changed nothing users can see
npm run package        # shotkit.zip
```

Architecture, invariants and conventions: [CLAUDE.md](CLAUDE.md); where each concern lives:
[.claude/CODEMAP.md](.claude/CODEMAP.md).

