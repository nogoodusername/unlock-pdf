/// <reference lib="webworker" />
import * as mupdf from 'mupdf'

export type WorkerRequest = {
  id: string
  bytes: ArrayBuffer
  password: string
}

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'result'; id: string; ok: true; bytes: ArrayBuffer }
  | {
      type: 'result'
      id: string
      ok: false
      error: 'wrong-password' | 'not-encrypted' | 'invalid-pdf' | 'unknown'
      message: string
    }

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, bytes, password } = event.data

  try {
    const doc = mupdf.Document.openDocument(bytes, 'application/pdf')
    const pdf = doc.asPDF()

    if (!pdf) {
      throw new Error('invalid-pdf')
    }

    if (doc.needsPassword()) {
      const result = pdf.authenticatePassword(password)
      if (result === 0) {
        respond({ type: 'result', id, ok: false, error: 'wrong-password', message: 'Incorrect password' })
        return
      }
    }

    const buffer = pdf.saveToBuffer('encrypt=none')
    const out = buffer.asUint8Array()
    // Copy out of the WASM heap before it's freed/transferred.
    const copy = out.slice().buffer

    respond({ type: 'result', id, ok: true, bytes: copy }, [copy])
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    respond({ type: 'result', id, ok: false, error: 'unknown', message })
  }
}

function respond(msg: WorkerResponse, transfer: Transferable[] = []) {
  ;(self as unknown as Worker).postMessage(msg, transfer)
}

respond({ type: 'ready' })
