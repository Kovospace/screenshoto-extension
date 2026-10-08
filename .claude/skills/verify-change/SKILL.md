---
name: verify-change
description: Verify a change to Screenshoto Web before calling it done — typecheck, unit tests, real-Chrome e2e, and for refactorings a byte-for-byte comparison of every user-observable outcome against a git ref. Use after any code change in this repo, and always when the change is meant to be behaviour-neutral (refactor, rename, restructure, dependency bump).
---

# Verify a Screenshoto Web change

Run in order; stop at the first failure and fix it (report test output faithfully).

1. `npm run typecheck && npm test` — seconds. All unit tests must pass.
2. `npm run test:e2e` — ~40 s, builds first, headless Chrome for Testing. Prints `ok`/`FAIL` per step.
3. **Behaviour-neutral changes only:** `npm run compare -- <ref>` (usually `main` or `HEAD`).
   It builds `<ref>` in a temporary git worktree, runs the *current* e2e scenario on both
   builds, and diffs every observation. Expect `IDENTICAL`. Any listed path is a user-visible
   change: either fix it, or — if intended — say so explicitly to the user.

If the change adds or alters behaviour (approved by the user):
- add a unit test next to the code's mirror path under `test/`; it must **fail without the
  change** — revert the change once and watch it fail;
- if users see it, add or adjust a step in `test-e2e/run.mjs` (UI strings are asserted there);
- update the README key table / text if keys or messages changed;
- update `.claude/CODEMAP.md` if a file or concern was added.

Notes
- Puppeteer downloads Chrome for Testing on `npm install` (`~/.cache/puppeteer`).
- e2e saves go to a temp profile's download folder, never `~/Downloads`.
