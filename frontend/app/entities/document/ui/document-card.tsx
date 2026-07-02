import { FileText, FileImage, File, Trash2 } from 'lucide-react'
import { Card, CardContent } from '~/shared/ui/card'
import { Button } from '~/shared/ui/button'
import { cn } from '~/shared/lib/utils'
import type { DocumentResponse } from '~/shared/api/generated/model'
import { getStatusColor, getStatusLabel } from '~/entities/document/model/types'

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return FileImage
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) return FileText
  return File
}

interface DocumentCardProps {
  document: DocumentResponse
  onDelete: (id: string) => void
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const Icon = getFileIcon(document.original_filename)
  const status = document.status

  return (
    <Card className="group relative hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-muted rounded-lg p-2 shrink-0">
              <Icon className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{document.title}</p>
              <p className="text-xs text-muted-foreground truncate">{document.original_filename}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={() => onDelete(document.id)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-medium', getStatusColor(status as any))}>
            {getStatusLabel(status as any)}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(document.created_at).toLocaleDateString()}
          </span>
        </div>

        {status === 'processing' || status === 'pending' ? (
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-1/2" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}