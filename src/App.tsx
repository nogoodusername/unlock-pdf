import { useMemo, useState } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Dropzone } from './components/Dropzone'
import { FileRow } from './components/FileRow'
import { removePdfPassword } from './lib/pdfClient'
import type { PdfItem } from './types'

function makeId() {
  return crypto.randomUUID()
}

function unlockedName(name: string) {
  return name.toLowerCase().endsWith('.pdf') ? `${name.slice(0, -4)}-unlocked.pdf` : `${name}-unlocked.pdf`
}

export default function App() {
  const [items, setItems] = useState<PdfItem[]>([])
  const [samePassword, setSamePassword] = useState(true)
  const [globalPassword, setGlobalPassword] = useState('')
  const [processing, setProcessing] = useState(false)

  const hasFiles = items.length > 0
  const allDone = hasFiles && items.every((i) => i.status === 'success')
  const successCount = items.filter((i) => i.status === 'success').length

  function addFiles(files: File[]) {
    const newItems: PdfItem[] = files.map((file) => ({
      id: makeId(),
      file,
      password: '',
      status: 'idle',
    }))
    setItems((prev) => [...prev, ...newItems])
  }

  function updatePassword(id: string, password: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, password } : i)))
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function clearAll() {
    setItems([])
    setGlobalPassword('')
  }

  function downloadOne(item: PdfItem) {
    if (item.resultBlob) saveAs(item.resultBlob, unlockedName(item.file.name))
  }

  async function downloadAll() {
    const zip = new JSZip()
    for (const item of items) {
      if (item.resultBlob) zip.file(unlockedName(item.file.name), item.resultBlob)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, 'unlocked-pdfs.zip')
  }

  async function handleSubmit() {
    setProcessing(true)
    setItems((prev) => prev.map((i) => ({ ...i, status: 'processing', errorMessage: undefined })))

    const targets = items
    await Promise.all(
      targets.map(async (item) => {
        const password = samePassword ? globalPassword : item.password
        const result = await removePdfPassword(item.file, password)
        setItems((prev) =>
          prev.map((i) => {
            if (i.id !== item.id) return i
            if (result.ok) {
              return { ...i, status: 'success', resultBlob: new Blob([result.bytes], { type: 'application/pdf' }) }
            }
            return {
              ...i,
              status: result.error === 'wrong-password' ? 'wrong-password' : 'error',
              errorMessage: result.message,
            }
          }),
        )
      }),
    )
    setProcessing(false)
  }

  const canSubmit = useMemo(() => {
    if (!hasFiles || processing) return false
    if (samePassword) return true
    return items.every((i) => i.password.length > 0 || i.status === 'success')
  }, [hasFiles, processing, samePassword, items])

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">UnlockPDF</h1>
          <p className="mt-3 text-neutral-500">
            Remove passwords from PDF files, right in your browser. Nothing is ever uploaded anywhere.
          </p>
        </header>

        <Dropzone onFiles={addFiles} />

        {hasFiles && (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={samePassword}
                  onChange={(e) => setSamePassword(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                Use the same password for all files
              </label>
              <button
                onClick={clearAll}
                disabled={processing}
                className="text-sm text-neutral-500 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear all
              </button>
            </div>

            {samePassword && (
              <input
                type="password"
                value={globalPassword}
                onChange={(e) => setGlobalPassword(e.target.value)}
                placeholder="Password (leave blank if files aren't password-protected)"
                className="mt-3 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
              />
            )}

            <div className="mt-6 flex flex-col gap-3">
              {items.map((item) => (
                <FileRow
                  key={item.id}
                  item={item}
                  usePerFilePassword={!samePassword}
                  onPasswordChange={updatePassword}
                  onRemove={removeItem}
                  onDownload={downloadOne}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {processing ? 'Removing passwords…' : 'Remove passwords'}
              </button>
              {allDone && successCount > 1 && (
                <button
                  onClick={downloadAll}
                  className="rounded-lg border border-accent px-5 py-2.5 font-medium text-accent hover:bg-accent/5"
                >
                  Download all as ZIP ({successCount})
                </button>
              )}
            </div>
          </>
        )}

        <footer className="mt-16 text-center text-xs text-neutral-400">
          Files are processed entirely in your browser using WebAssembly — nothing is sent to a server.
        </footer>
      </div>
    </div>
  )
}
