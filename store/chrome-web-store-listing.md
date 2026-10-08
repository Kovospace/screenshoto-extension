# Chrome Web Store listing — Screenshoto Web

Everything to paste into the Developer Dashboard (https://chrome.google.com/webstore/devconsole),
tab by tab, plus the publishing steps. English only: the extension's UI is English.

**What's in `store/`**

| File | What it is |
|---|---|
| `chrome-web-store-listing.md` | this file |
| `privacy-policy.md` | privacy policy to link from the Privacy tab |
| `materials/store-icon/icon-128.png` | store icon (96 px artwork, 16 px transparent padding) |
| `materials/promo/small-promo-tile.png` | small promo tile 440×280, 24-bit; source `small-promo-tile.html` |
| `materials/screenshots/1-5.png` | screenshots, 1280×800, 24-bit (made by hand; see section 1) |
| `render-graphics.mjs` | re-renders the promo tile and store icon: `node store/render-graphics.mjs` |
| `screenshoto-web-<version>.zip` | the upload package (git-ignored): `npm run package:store` |

---

## Publishing steps

1. **Developer account** — the one used for Tabilinks works (one-time $5 fee, already paid).
   The publisher name shown on the listing is the account's, under *Account*.
2. **Repository public** — the homepage, support and privacy-policy URLs below point at
   `https://github.com/Kovospace/screenshoto-extension`. Make the repository public first
   (or host `privacy-policy.md` elsewhere, e.g. on kovo.space, and use that URL).
3. **Screenshots** — make 1–5 by hand into `store/materials/screenshots/` (section 1).
4. **Package** — `npm run package:store` → `store/screenshoto-web-1.1.0.zip`
   (typechecks, release build without source maps, `manifest.json` at the zip root).
   Before that, run the tests: `npm test && npm run test:e2e`.
5. **Upload** — Dashboard → *Add new item* → choose the zip. Name and summary are read from the
   manifest (section 0).
6. **Fill in the tabs** — *Store listing* (section 1), *Privacy* (section 2),
   *Distribution* (section 3), *Test instructions* (section 4).
7. **Submit for review.** Expect a longer, manual review because of the `debugger` permission
   (days rather than hours); the justification in section 2 is written for that reviewer.
   Choose *defer publishing* if you want to publish by hand after approval.
8. **After approval** — publish; for the first release consider *Unlisted*, install from the
   store link on a clean Chrome profile, try a capture, then switch to *Public*.
9. **Updates** — bump `version` in `public/manifest.json` and `package.json` (the `release`
   skill does this), `npm run package:store`, Dashboard → *Package* → *Upload new package*,
   submit. The store rejects a version that is not higher than the published one.

---

## 0. Name and summary come from the manifest

The dashboard does not let you edit them; change `public/manifest.json` and re-upload.

| Field | Limit | Value |
|---|---|---|
| `name` | 75 chars | `Screenshoto Web` |
| `description` (summary) | 132 chars | `Capture a region or element at true 1×–4× retina resolution, annotate it, save it. Simple, fast and free.` (105) |

---

## 1. Store listing tab

**Category:** Productivity → Tools
**Language:** English

### Detailed description

```
Screenshots that stay sharp: select part of any web page and get it at true 1×, 2×, 3× and 4× resolution – annotated and saved in seconds.

WHY SCREENSHOTO WEB

• True retina-sized images – the page is really re-rendered at each pixel density, the same way Chrome's own DevTools takes screenshots. Text, icons, SVG and CSS come out crisp at 2×, 3× and 4×. Nothing is just a blurry 1× capture scaled up.

• Simple – capture an area or an element, mark it up, save it. No rarely used extras, no editing suite to learn: one compact toolbar with the tools you actually need.

• Fast – a keyboard shortcut or the right-click menu to start, single-key tools, Ctrl+C to copy and Ctrl+S to save. From click to finished file in a few seconds.

• Free, all the way – no account, no trial, no watermark and no "upgrade to download" waiting for you at the end of your work. Every feature is free.

CAPTURE
• Area: drag a rectangle, fine-tune it with the handles or move it, then click the camera button or press Enter
• Element: hover any part of the page, press ↑ / ↓ to step to its parent or back to the child, click to capture its exact bounds
• Start from the toolbar button, Alt+Shift+S, or right-click → Capture area / Capture element
• Every capture is rendered at 1×, 2×, 3× and 4× at once – switch between them in the editor

ANNOTATE
• Arrows, rectangles, ellipses, text and numbered step markers
• 7 colours and 3 sizes; hold Shift for squares, circles and 45° arrows
• Move, resize, recolour, nudge with the arrow keys; undo and redo
• Annotations look identical at every resolution

SAVE
• Copy to the clipboard, or save as PNG – the current scale or all four at once
• Files are named after the site and the time, in Downloads/Screenshoto Web
• Settings: choose the folder inside Downloads and the scale suffix (@2x, _2, _2x …)
• Captures stay in your browser for 7 days, so you can reopen the editor and carry on

PRIVACY
Nothing leaves your computer. No account, no servers, no analytics, no network requests at all. Captures are stored only in your browser and deleted after 7 days.

ABOUT THE "STARTED DEBUGGING THIS BROWSER" BAR
To render the page at higher pixel densities, Screenshoto Web uses Chrome's DevTools protocol for about a second while it captures. Chrome shows its standard notice bar meanwhile; it goes away by itself. Only the tab you are capturing is touched, and only when you start a capture.

GOOD TO KNOW
• Chrome does not let any extension run on chrome:// pages, the New Tab page or the Chrome Web Store
• Images that a website only provides in low resolution stay low resolution
• A very large area at 4× can exceed Chrome's maximum image size; that scale is then unavailable and the others still work
```

### Graphics

| Asset | Size | Status |
|---|---|---|
| Store icon | 128×128 PNG | ready: `store/materials/store-icon/icon-128.png` |
| Screenshots | 1280×800 (or 640×400), 1–5, PNG/JPEG **without alpha** | ready: `store/materials/screenshots/1-5.png` (24-bit, no alpha) |
| Small promo tile | 440×280 | ready: `store/materials/promo/small-promo-tile.png` |
| Marquee promo tile | 1400×560 | optional — skip; only used if Google features the extension |

Suggested screenshots, in this order (the first one is what most people see):
1. **The editor** with a capture of a good-looking page, annotated: an arrow, a rectangle, two
   numbered steps and a short text; the 2× button active, so the toolbar shows "Save 2×".
2. **Adjusting a selection** on a page: the dimmed page, the rectangle with its handles, the
   size label and the camera button, the picker bar with its hint at the top.
3. **Real pixels vs. upscaling** — the selling point: one crop of text/icons at 4× next to the
   same crop from a 1× screenshot scaled up 4×. Add two short captions ("Screenshoto Web 4×",
   "1× scaled up"). Easiest made from two saved files in any image editor.
4. **Element picking**: the orange highlight around a card, the size label, the hint
   "↑ parent · ↓ child".
5. **The right-click menu** showing *Screenshoto Web → Capture area / Capture element*.

How to make them pixel-exact:
- A Chrome window whose page area is 1280×800 at 100 % zoom, on a display at scale 1 — or take a
  larger screenshot and scale/crop to exactly 1280×800.
- Remove the alpha channel (the store refuses it):
  `convert in.png -background white -alpha remove -alpha off PNG24:store/materials/screenshots/1.png`
- Check: `file store/materials/screenshots/*.png` must say `1280 x 800, 8-bit/color RGB`.

### Links
- Official URL (homepage): `https://github.com/Kovospace/screenshoto-extension`
- Support URL: `https://github.com/Kovospace/screenshoto-extension/issues`

---

## 2. Privacy tab

### Single purpose
```
Screenshoto Web captures a user-selected area or element of the current web page at true 1×–4× resolution, lets the user annotate it, and saves or copies it as a PNG image.
```

### Permission justifications

| Permission | Justification to paste |
|---|---|
| `activeTab` | `Grants access to the current tab only when the user starts a capture (toolbar button, Alt+Shift+S or the right-click menu), so the selection overlay can be shown there and the selected area captured. No other tab is accessed.` |
| `scripting` | `Injects the selection overlay (drag an area or pick an element) into the current tab when the user starts a capture, and measures the position of the element the user picked.` |
| `debugger` | `This is how the extension produces real high-resolution screenshots instead of upscaled ones. When the user confirms a selection, it attaches to that one tab for about a second, re-renders the page at device pixel ratios 1, 2, 3 and 4 (Emulation.setDeviceMetricsOverride), waits for images to load (Runtime.evaluate), captures only the selected rectangle (Page.captureScreenshot) and detaches, restoring the page. It is never attached without an explicit user action, never to another tab, and reads nothing except the requested image. Chrome's own "started debugging" notice is shown while it runs.` |
| `downloads` | `Saves the annotated screenshots as PNG files to the user's Downloads folder when the user clicks Save, Save all or presses Ctrl+S.` |
| `contextMenus` | `Adds "Capture area" and "Capture element" to the page's right-click menu, as another way to start a capture.` |
| `storage` | `Remembers the user's two settings – the folder inside Downloads to save images to, and the file name suffix for the scale (e.g. "@2x" or "_2") – in chrome.storage.sync, so they apply in every editor tab and follow the user's Chrome profile.` |

Host permissions: **none** requested.

### Remote code
**No, I am not using remote code.** (All code is in the package; the extension makes no network requests.)

### Data usage
Tick **nothing** — the extension collects no user data. Screenshots are taken only on the
user's request, processed and stored only locally (IndexedDB, deleted after 7 days) and saved
only to the user's own disk; nothing is transmitted anywhere, and "collection" in the store's
sense means transmitting data off the device.

Then tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL
`https://github.com/Kovospace/screenshoto-extension/blob/main/store/privacy-policy.md`

---

## 3. Distribution tab
- Payments: **Free of charge**
- Visibility: **Unlisted** for the first release (try a real store install), then **Public**
- Regions: all

## 4. Test instructions tab (for the reviewer)
```
No account or setup is needed.

1. Open any normal web page (not chrome:// or the Web Store).
2. Click the toolbar icon (or press Alt+Shift+S, or right-click → Screenshoto Web → Capture area).
3. Drag a rectangle; adjust it with the handles if you like; click the blue camera button under it (or press Enter).
   Chrome shows "Screenshoto Web started debugging this browser" for about a second – that is the
   re-render at 1×–4× described in the debugger justification.
4. The editor opens in a new tab. Draw an arrow, switch scales with the 1×–4× buttons, click "Save 2×".
   The file appears in Downloads/Screenshoto Web.
5. Element mode: start a capture, press E, hover a part of the page, click.
```
