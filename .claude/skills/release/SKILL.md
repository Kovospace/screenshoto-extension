---
name: release
description: Cut a Screenshoto Web release — bump the version, verify, and produce screenshoto-web.zip for loading unpacked or uploading to the Chrome Web Store. Use when the user asks to release, package, zip, publish or bump the version.
---

# Release

1. Ask for the version if not given (semver; patch for fixes, minor for features).
2. Set it in **both** `public/manifest.json` (`version`, what Chrome reads) and `package.json`.
3. Run the `verify-change` skill steps 1–2 (`npm run typecheck && npm test`, `npm run test:e2e`).
4. `npm run package:store` → `store/screenshoto-web-<version>.zip` (git-ignored; manifest at the zip
   root, no source maps) — the file to upload. `npm run package` makes `screenshoto-web.zip` for
   Load unpacked. Report sizes. Store steps and texts: `store/chrome-web-store-listing.md`;
   if a feature changed, update its detailed description and permission justifications too.
5. Commit only if the user asks (message e.g. `Release 1.1.0`); never push to `main` without asking.

Web Store notes: the `debugger` permission triggers a manual review and a warning on install;
its justification is the README section "How the real 2×–4× works".
