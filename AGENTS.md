# AGENTS.md

Guidance for AI coding agents working in this repo.

## What this is

UnlockPDF — a fully static, client-side PDF password remover. Deployed to
Cloudflare Pages at `unlockpdf.imhx.top`. No backend, no server, no file
upload of any kind: everything happens in the browser.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite` plugin, `@theme` tokens in `src/index.css`)
- `mupdf` npm package (WASM build of MuPDF) — opens/decrypts PDFs, run inside
  a Web Worker so the UI thread never blocks
- `react-dropzone`, `jszip`, `file-saver`

## Structure

```
src/
  App.tsx                 # all app state + UI composition
  types.ts                # PdfItem / FileStatus
  components/
    Dropzone.tsx           # drag-and-drop / click-to-browse
    FileRow.tsx             # per-file row: password input, status, download
  lib/
    pdfWorker.ts             # Web Worker: mupdf logic (open, authenticate, save)
    pdfClient.ts              # main-thread wrapper: ready-handshake + postMessage
public/
  _headers                     # Cloudflare Pages: immutable caching for hashed assets + .wasm
LICENSE.md                     # AGPL-3.0-or-later (full text, matches mupdf's license)
```

## Commands

```bash
npm install
npm run dev       # vite dev server
npm run build     # tsc -b && vite build -> dist/
npm run preview   # serve the production build locally
npx tsc --noEmit -p tsconfig.app.json   # typecheck only
```

There is no test suite. Verify UI changes by running the dev server and
exercising the app in a browser (see Testing note below).

## Deployment

Cloudflare Pages is connected to this GitHub repo
(`github.com/nogoodusername/unlock-pdf`) via Git integration and auto-deploys
on push to `main`. Build command `npm run build`, output directory `dist`.
Custom domain `unlockpdf.imhx.top` is already configured — no manual deploy
steps needed, just push to `main`.

## Important gotchas

- **Worker ready-handshake is load-bearing.** `pdfWorker.ts` imports `mupdf`
  statically, which is large enough that the worker's `self.onmessage`
  listener can attach well after `new Worker()` returns. `pdfClient.ts`
  waits for a `{ type: 'ready' }` message from the worker before posting any
  real request — do not remove this and go back to posting immediately after
  construction, or requests can silently vanish (this was a real bug, not
  theoretical).
- **Password removal = re-save with `encrypt=none`.** There's no explicit
  "decrypt" API; the flow is `openDocument` → `authenticatePassword` →
  `saveToBuffer('encrypt=none')`. `authenticatePassword` returns `0` on
  failure, non-zero on success (not a boolean).
- **mupdf is AGPL-3.0-or-later.** Since it ships to the browser, this repo
  must stay public, `LICENSE.md` must stay accurate, and the footer's
  "Source on GitHub" link in `App.tsx` must keep pointing at a real, public
  repo. Don't quietly make the repo private or drop the footer link.
- **Never send file contents anywhere.** The whole point of this app is that
  files never leave the browser. Don't introduce any network call that
  touches uploaded file bytes.

## Testing UI changes

Use the Claude Browser preview tooling against `npm run dev` (port 5173, see
`.claude/launch.json`). There's no sample encrypted PDF checked into the
repo; generate one ad hoc with the `mupdf` package if you need to test the
password-removal flow end-to-end (see git history for an example script that
built a one-page AES-256-encrypted test PDF via `PDFDocument.addPage` +
`saveToBuffer('encrypt=aes-256,owner-password=...,user-password=...')`).
