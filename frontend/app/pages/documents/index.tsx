import { useDocuments } from '~/entities/document/model/use-documents'
import { useDeleteDocument } from '~/entities/document/model/use-delete-document'
import { DocumentCard } from '~/entities/document/ui/document-card'
import { UploadZone } from '~/features/upload-document/ui/upload-zone'
import { ErrorState } from '~/shared/ui/error-state'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function DocumentsPage() {
  const { data: documents, isLoading, isError, refetch } = useDocuments()
  const { mutate: deleteDocument } = useDeleteDocument()
  const queryClient = useQueryClient()

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
    <div className="p-6 flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {documents?.length ?? 0} document{documents?.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <UploadZone />

      {isError ? (
        <ErrorState message="Failed to load documents" onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : documents?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No documents yet</p>
          <p className="text-sm mt-1">Upload your first document above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents?.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={deleteDocument}
            />
          ))}
        </div>
      )}
    </div>
  )
}