import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Upload, FileUp, X } from 'lucide-react'
import { cn } from '~/shared/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDocument } from '~/shared/api/generated/document/document'

const { uploadDocumentsApiV1DocumentUploadPost } = getDocument()

export function useDocumentUpload() {
  const [failedFiles, setFailedFiles] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { mutate: upload, isPending } = useMutation({
    mutationFn: (file: File) =>
      uploadDocumentsApiV1DocumentUploadPost({ document: file }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (_error, file) => {
      setFailedFiles((prev) => [...prev, file.name])
    },
  })

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    setFailedFiles([])
    Array.from(files).forEach((file) => upload(file))
  }, [upload])

  const dismissFailed = (index: number) =>
    setFailedFiles((prev) => prev.filter((_, i) => i !== index))

  return { handleFiles, isPending, failedFiles, dismissFailed }
}

interface UploadButtonProps {
  onFiles: (files: FileList | null) => void
  isPending: boolean
}

export function UploadButton({ onFiles, isPending }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.md,.txt,.docx"
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="h-8 shrink-0 rounded-full bg-invert-bg px-3.5 text-[12.5px] font-medium text-invert-foreground hover:opacity-85 disabled:opacity-50 transition-opacity"
      >
        {isPending ? 'Загрузка…' : 'Загрузить'}
      </button>
    </>
  )
}

interface DropZoneProps {
  onFiles: (files: FileList | null) => void
  className?: string
  children: ReactNode
}

// Drag-and-drop работает по всей области списка документов, а не в отдельной
// dashed-зоне — визуальный маркер здесь минимальный (лёгкая заливка фона).
export function DropZone({ onFiles, className, children }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div
      className={cn('transition-colors', isDragging && 'bg-muted/60', className)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        onFiles(e.dataTransfer.files)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
    >
      {children}
    </div>
  )
}

// Дашборд-версия с dashed-рамкой — используется на онбординге (вне скоупа этого
// редизайна, там композиция другая: одна общая зона, не список + отдельная кнопка).
export function UploadZone() {
  const { handleFiles, isPending, failedFiles, dismissFailed } = useDocumentUpload()
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <label
        className={cn(
          'flex items-center gap-4 w-full border-2 border-dashed rounded-2xl p-6.5 cursor-pointer transition-colors',
          isDragging
            ? 'border-foreground/40 bg-accent'
            : 'border-border hover:border-foreground/25 hover:bg-muted/50',
          isPending && 'opacity-50 pointer-events-none'
        )}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
      >
        <input
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.md,.txt,.docx"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <div className="size-10 rounded-[10px] bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
          {isPending ? <FileUp className="size-4.5 animate-bounce" /> : <Upload className="size-4.5" />}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">
            {isPending ? 'Загрузка...' : 'Перетащите файлы сюда для загрузки'}
          </p>
          <p className="text-xs text-faint-foreground">PDF, MD, TXT, DOCX · до 50 МБ каждый</p>
        </div>
      </label>

      <UploadFailures failedFiles={failedFiles} onDismiss={dismissFailed} />
    </div>
  )
}

export function UploadFailures({ failedFiles, onDismiss }: { failedFiles: string[]; onDismiss: (index: number) => void }) {
  if (failedFiles.length === 0) return null
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
      {failedFiles.map((name, i) => (
        <div key={`${name}-${i}`} className="flex items-center justify-between gap-2">
          <span className="truncate">Не удалось загрузить «{name}»</span>
          <button type="button" className="shrink-0" onClick={() => onDismiss(i)}>
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
