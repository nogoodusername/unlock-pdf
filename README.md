# UnlockPDF

Remove passwords from PDF files entirely in the browser. Nothing is uploaded — all
decryption happens client-side via a WebAssembly build of [MuPDF](https://mupdf.com)
(`mupdf` npm package, run inside a Web Worker so the UI stays responsive).

## Features

- Drag-and-drop or click-to-browse multi-file upload (PDFs only)
- One shared password for a batch, or a separate password per file
- Per-file status (ready / processing / unlocked / wrong password / error)
- Download individual unlocked files, or all of them as a single ZIP

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- `mupdf` (WASM) for opening/decrypting PDFs, run in a Web Worker
- `react-dropzone`, `jszip`, `file-saver`

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build locally
```

## Deploying to Cloudflare Pages

This is a fully static site — the entire `dist/` output can be served as-is,
no server/functions needed.

1. Push this repo to GitHub (or GitLab).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**,
   select this repo.
3. Build settings:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Deploy. Cloudflare will give you a `*.pages.dev` URL first.
5. Add the custom subdomain: in the Pages project → **Custom domains** → add
   `unlockpdf.imhx.top` (requires `imhx.top` to already be on Cloudflare DNS).

Alternatively, deploy directly from the CLI without connecting Git:

```bash
npm run build
npx wrangler pages deploy dist --project-name=unlockpdf
```

### Notes

- `public/_headers` sets long-lived immutable caching for hashed assets and the
  `.wasm` binary (~10 MB uncompressed; Cloudflare serves it Brotli/gzip-compressed
  in transit, so real transfer size is a few MB).
- The MuPDF WASM library is licensed AGPL-3.0-or-later. Since this app ships the
  library to the browser (not just uses it server-side), keeping the source of
  this repo publicly available satisfies the AGPL's network-use clause — link to
  the repo somewhere on the deployed site (e.g. footer) once it's public.
