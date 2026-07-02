import { useCallback, useState } from 'react'
import { Upload, FileUp } from 'lucide-react'
import { cn } from '~/shared/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDocument } from '~/shared/api/generated/document/document'

const { uploadDocumentsApiV1DocumentUploadPost } = getDocument()

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const queryClient = useQueryClient()

  const { mutate: upload, isPending } = useMutation({
    mutationFn: (file: File) =>
      uploadDocumentsApiV1DocumentUploadPost({ document: file }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => upload(file))
  }, [upload])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <label
      className={cn(
        'flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
        isPending && 'opacity-50 pointer-events-none'
      )}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.md,.txt,.docx"
        onChange={onFileInput}
      />
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        {isPending ? (
          <FileUp className="size-8 animate-bounce" />
        ) : (
          <Upload className="size-8" />
        )}
        <p className="text-sm font-medium">
          {isPending ? 'Uploading...' : 'Drop files here or click to upload'}
        </p>
        <p className="text-xs">PDF, MD, TXT, DOCX up to 50MB</p>
      </div>
    </label>
  )
}