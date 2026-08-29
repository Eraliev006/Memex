import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDocuments } from '~/entities/document/model/use-documents'
import { useDeleteDocument } from '~/entities/document/model/use-delete-document'
import { DocumentCard } from '~/entities/document/ui/document-card'
import { useDocumentUpload, UploadButton, DropZone, UploadFailures } from '~/features/upload-document/ui/upload-zone'
import { ErrorState } from '~/shared/ui/error-state'

export function DocumentsPage() {
  const { data: documents, isLoading, isError, refetch } = useDocuments()
  const { mutate: deleteDocument } = useDeleteDocument()
  const queryClient = useQueryClient()
  const { handleFiles, isPending, failedFiles, dismissFailed } = useDocumentUpload()

  // polling для документов в статусе pending/processing
  useEffect(() => {
    const hasPending = documents?.some(
      (d) => d.status === 'pending' || d.status === 'processing'
    )
    if (!hasPending) return

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    }, 2000)

    return () => clearInterval(interval)
  }, [documents, queryClient])

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-[22px] pt-11 pb-14">
      <div className="max-w-[680px] w-full mx-auto flex flex-col gap-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-[30px] font-normal tracking-[-0.01em] text-foreground">Документы</h1>
            <p className="mt-1.5 text-[13px] text-faint-foreground">
              {documents?.length ?? 0} файлов
            </p>
          </div>
          <UploadButton onFiles={handleFiles} isPending={isPending} />
        </div>

        <UploadFailures failedFiles={failedFiles} onDismiss={dismissFailed} />

        <DropZone onFiles={handleFiles} className="flex flex-col -mx-1.5 rounded-2xl">
          {isError ? (
            <ErrorState message="Не удалось загрузить документы" onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="flex flex-col gap-2 px-1.5 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : documents?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-faint-foreground">
              <p className="text-sm">Пока нет документов — перетащите файл сюда или нажмите «Загрузить»</p>
            </div>
          ) : (
            documents?.map((doc) => (
              <DocumentCard key={doc.id} document={doc} onDelete={deleteDocument} />
            ))
          )}
        </DropZone>
      </div>
    </div>
  )
}
