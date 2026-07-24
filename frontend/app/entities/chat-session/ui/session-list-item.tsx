import { memo } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '~/shared/lib/utils'
import { Button } from '~/shared/ui/button'
import { formatRelativeTime } from '~/shared/lib/format-relative-time'
import type { ChatSessionResponse } from '~/shared/api/generated/model'
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

interface SessionListItemProps {
  session: ChatSessionResponse
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export const SessionListItem = memo(function SessionListItem({ session, isActive, onSelect, onDelete }: SessionListItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors hover:bg-muted',
        isActive && 'bg-muted'
      )}
      onClick={() => onSelect(session.id)}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('text-[13px] truncate', isActive ? 'font-semibold' : 'font-medium')}>
          {session.title || 'Новый чат'}
        </p>
        <p className="text-[11px] text-faint-foreground">
          {session.last_message_at ? formatRelativeTime(session.last_message_at) : formatRelativeTime(session.created_at)}
        </p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить чат?</AlertDialogTitle>
            <AlertDialogDescription>
              «{session.title || 'Новый чат'}» и все его сообщения будут удалены безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(session.id)
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})
