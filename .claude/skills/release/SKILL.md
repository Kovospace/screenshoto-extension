---
name: release
description: Cut a Screenshoto Web release — bump the version, verify, and produce screenshoto-web.zip for loading unpacked or uploading to the Chrome Web Store. Use when the user asks to release, package, zip, publish or bump the version.
---

# Release

1. Ask for the version if not given (semver; patch for fixes, minor for features).
2. Set it in **both** `public/manifest.json` (`version`, what Chrome reads) and `package.json`.
3. Run the `verify-change` skill steps 1–2 (`npm run typecheck && npm test`, `npm run test:e2e`).
4. `npm run package` → `screenshoto-web.zip` at the repo root (git-ignored), top folder `screenshoto-web/`,
   source maps excluded. Report its size (`ls -l screenshoto-web.zip`).
5. Commit only if the user asks (message e.g. `Release 1.1.0`); never push to `main` without asking.

Web Store notes: the `debugger` permission triggers a manual review and a warning on install;
its justification is the README section "How the real 2×–4× works".
