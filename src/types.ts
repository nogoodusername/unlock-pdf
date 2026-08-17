export type FileStatus = 'idle' | 'processing' | 'success' | 'wrong-password' | 'error'

export interface PdfItem {
  id: string
  file: File
  password: string
  status: FileStatus
  errorMessage?: string
  resultBlob?: Blob
}
