# Screenshoto Web — Privacy Policy

*Last updated: 8 October 2026*

Screenshoto Web is a Chrome extension that captures a part of a web page you select, lets you
annotate it, and saves or copies it as an image.

## What we collect

**Nothing.** Screenshoto Web has no account, no servers, no analytics, no advertising and no
tracking. It makes no network requests at all.

## What stays on your computer

- **Captures and their annotations** are stored in your browser's local storage (IndexedDB)
  so you can reopen the editor. They are deleted automatically after 7 days, and also when you
  remove the extension.
- **Saved images** go to your own Downloads folder, and **copied images** to your clipboard,
  only when you choose Save or Copy.

None of this is ever sent to the developer or to anyone else.

## Permissions and why they are needed

- **activeTab, scripting** — to show the selection overlay on the tab you are capturing, only
  after you start a capture.
- **debugger** — to re-render that tab at higher pixel densities for about a second and take
  the screenshot of the area you selected. Nothing else is read from the page.
- **downloads** — to save your images when you click Save.
- **contextMenus** — to offer "Capture area" and "Capture element" on right-click.

## Contact

Questions or concerns: open an issue at
https://github.com/Kovospace/screenshoto-extension/issues
