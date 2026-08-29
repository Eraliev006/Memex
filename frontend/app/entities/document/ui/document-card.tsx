import type { DocumentResponse } from '~/shared/api/generated/model'
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

function extLabel(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext || 'FILE'
}

function statusMeta(status: DocumentResponse['status']): string {
  switch (status) {
    case 'ready': return 'готов'
    case 'processing': return 'индексируется'
    case 'pending': return 'в очереди'
    case 'failed': return 'ошибка'
  }
}

interface DocumentCardProps {
  document: DocumentResponse
  onDelete: (id: string) => void
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  return (
    <AlertDialog>
      <div className="flex items-center gap-3.5 border-t border-border px-1.5 py-3.5 hover:bg-secondary transition-colors">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{document.title}</span>
          <span className="mt-[3px] block truncate text-xs text-faint-foreground">
            {extLabel(document.original_filename)} · {statusMeta(document.status)}
          </span>
        </span>
        <span className="shrink-0 text-xs text-faint-foreground">
          {new Date(document.created_at).toLocaleDateString()}
        </span>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            className="shrink-0 text-xs text-faint-foreground underline hover:text-foreground transition-colors"
          >
            Удалить
          </button>
        </AlertDialogTrigger>
      </div>

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
  )
}
