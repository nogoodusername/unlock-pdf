import type { PdfItem } from '../types'

interface Props {
  item: PdfItem
  usePerFilePassword: boolean
  onPasswordChange: (id: string, password: string) => void
  onRemove: (id: string) => void
  onDownload: (item: PdfItem) => void
}

const statusLabel: Record<PdfItem['status'], string> = {
  idle: 'Ready',
  processing: 'Removing password…',
  success: 'Unlocked',
  'wrong-password': 'Wrong password',
  error: 'Failed',
}

export function FileRow({ item, usePerFilePassword, onPasswordChange, onRemove, onDownload }: Props) {
  const sizeKb = (item.file.size / 1024).toFixed(0)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <svg className="h-8 w-8 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">{item.file.name}</p>
          <p className="text-xs text-neutral-500">
            {sizeKb} KB · <StatusText item={item} />
          </p>
        </div>
      </div>

      {usePerFilePassword && item.status !== 'success' && (
        <input
          type="password"
          value={item.password}
          onChange={(e) => onPasswordChange(item.id, e.target.value)}
          placeholder="Password for this file"
          className="w-full sm:w-56 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
        />
      )}

      <div className="flex shrink-0 items-center gap-2">
        {item.status === 'success' ? (
          <button
            onClick={() => onDownload(item)}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark"
          >
            Download
          </button>
        ) : (
          <button
            onClick={() => onRemove(item.id)}
            className="rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

function StatusText({ item }: { item: PdfItem }) {
  const color =
    item.status === 'success'
      ? 'text-green-600 dark:text-green-400'
      : item.status === 'wrong-password' || item.status === 'error'
        ? 'text-red-500'
        : item.status === 'processing'
          ? 'text-accent'
          : 'text-neutral-500'

  return <span className={color}>{statusLabel[item.status]}{item.errorMessage && item.status === 'error' ? `: ${item.errorMessage}` : ''}</span>
}
