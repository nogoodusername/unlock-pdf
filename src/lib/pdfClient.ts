import type { WorkerRequest, WorkerResponse } from './pdfWorker'

export type UnlockResult =
  | { ok: true; bytes: ArrayBuffer }
  | { ok: false; error: 'wrong-password' | 'not-encrypted' | 'invalid-pdf' | 'unknown'; message: string }

let readyPromise: Promise<Worker> | null = null
const pending = new Map<string, (res: WorkerResponse & { type: 'result' }) => void>()

function getWorker(): Promise<Worker> {
  if (readyPromise) return readyPromise

  readyPromise = new Promise((resolve) => {
    const w = new Worker(new URL('./pdfWorker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === 'ready') {
        resolve(w)
        return
      }
      const cb = pending.get(event.data.id)
      if (cb) {
        pending.delete(event.data.id)
        cb(event.data)
      }
    }
  })
  return readyPromise
}

export async function removePdfPassword(file: File, password: string): Promise<UnlockResult> {
  const w = await getWorker()
  const id = crypto.randomUUID()
  const bytes = await file.arrayBuffer()

  return new Promise((resolve) => {
    pending.set(id, (res) => {
      if (res.ok) resolve({ ok: true, bytes: res.bytes })
      else resolve({ ok: false, error: res.error, message: res.message })
    })
    const req: WorkerRequest = { id, bytes, password }
    w.postMessage(req, [bytes])
  })
}
