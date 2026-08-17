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

## License

The MuPDF WASM library (`mupdf` npm package) is licensed AGPL-3.0-or-later. This
repo is public to satisfy the AGPL's network-use clause, and the deployed site
links back to it in the footer.
