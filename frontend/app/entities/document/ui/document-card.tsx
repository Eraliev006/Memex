import { FileText, FileImage, File, MoreHorizontal } from 'lucide-react'
import { Card, CardContent } from '~/shared/ui/card'
import { Button } from '~/shared/ui/button'
import { cn } from '~/shared/lib/utils'
import type { DocumentResponse } from '~/shared/api/generated/model'
import { getStatusBadgeClass, getStatusLabel } from '~/entities/document/model/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/shared/ui/alert-dialog'

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
    <Card className="rounded-2xl">
      <CardContent className="p-4.5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="bg-muted rounded-[10px] size-9.5 flex items-center justify-center shrink-0">
            <Icon className="size-4.5 text-muted-foreground" />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 -mt-0.5 -mr-1 text-faint-foreground">
                <MoreHorizontal className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить документ?</AlertDialogTitle>
                <AlertDialogDescription>
                  «{document.title}» будет удалён безвозвратно вместе со всеми векторами. Это действие нельзя отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDelete(document.id)}
                >
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="font-semibold text-sm truncate">{document.title}</p>
          <p className="text-xs text-muted-foreground truncate">{document.original_filename}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className={cn('text-[11.5px] font-semibold px-2.5 py-1 rounded-full', getStatusBadgeClass(status))}>
            {getStatusLabel(status)}
          </span>
          <span className="text-[11.5px] text-faint-foreground">
            {new Date(document.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
