import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface Props {
  onFiles: (files: File[]) => void
}

export function Dropzone({ onFiles }: Props) {
  const [rejected, setRejected] = useState<string | null>(null)

  const onDrop = useCallback(
    (accepted: File[], fileRejections: { file: File }[]) => {
      setRejected(fileRejections.length > 0 ? 'Only PDF files are accepted.' : null)
      if (accepted.length > 0) onFiles(accepted)
    },
    [onFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-accent bg-accent/5 dark:bg-accent/10' : 'border-neutral-300 dark:border-neutral-700 hover:border-accent/60'}`}
      >
        <input {...getInputProps()} />
        <svg
          className="h-10 w-10 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
          />
        </svg>
        <p className="text-neutral-700 dark:text-neutral-300 font-medium">
          {isDragActive ? 'Drop your PDFs here' : 'Drag & drop PDF files here'}
        </p>
        <p className="text-sm text-neutral-500">or click to browse — multiple files supported</p>
      </div>
      {rejected && <p className="mt-2 text-sm text-red-500">{rejected}</p>}
    </div>
  )
}
