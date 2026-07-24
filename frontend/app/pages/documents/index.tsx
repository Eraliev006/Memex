import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDocuments } from '~/entities/document/model/use-documents'
import { useDeleteDocument } from '~/entities/document/model/use-delete-document'
import { DocumentCard } from '~/entities/document/ui/document-card'
import { UploadZone } from '~/features/upload-document/ui/upload-zone'
import { ErrorState } from '~/shared/ui/error-state'
import { Input } from '~/shared/ui/input'

export function DocumentsPage() {
  const { data: documents, isLoading, isError, refetch } = useDocuments()
  const { mutate: deleteDocument } = useDeleteDocument()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')

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

  const filtered = useMemo(() => {
    if (!query.trim()) return documents
    const q = query.trim().toLowerCase()
    return documents?.filter((d) => d.title.toLowerCase().includes(q) || d.original_filename.toLowerCase().includes(q))
  }, [documents, query])

  return (
    <div className="p-8 flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Документы</h1>
          <p className="text-[13.5px] text-muted-foreground mt-1">
            {documents?.length ?? 0} документов в базе знаний
          </p>
        </div>
        <Input
          placeholder="Поиск по имени..."
          className="h-9.5 w-56 rounded-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <UploadZone />

      {isError ? (
        <ErrorState message="Не удалось загрузить документы" onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : documents?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Пока нет документов</p>
          <p className="text-sm mt-1">Загрузите первый документ выше</p>
        </div>
      ) : filtered?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">Ничего не найдено по запросу «{query}»</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((doc) => (
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
