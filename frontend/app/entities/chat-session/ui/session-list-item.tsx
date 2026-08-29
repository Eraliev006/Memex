import { memo, useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '~/shared/lib/utils'
import { Button } from '~/shared/ui/button'
import { formatRelativeTime } from '~/shared/lib/format-relative-time'
import type { ChatSessionResponse } from '~/shared/api/generated/model'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/shared/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/shared/ui/alert-dialog'

interface SessionListItemProps {
  session: ChatSessionResponse
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export const SessionListItem = memo(function SessionListItem({ session, isActive, onSelect, onDelete }: SessionListItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div
      className={cn(
        'group flex items-center gap-2 h-8 px-2 rounded-[9px] cursor-pointer transition-colors hover:bg-accent',
        isActive && 'bg-accent'
      )}
      onClick={() => onSelect(session.id)}
    >
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-[13px]',
          isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
        )}
      >
        {session.title || 'Новый чат'}
      </span>
      <span className="shrink-0 text-[11px] text-faint-foreground group-hover:hidden">
        {session.last_message_at ? formatRelativeTime(session.last_message_at) : formatRelativeTime(session.created_at)}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hidden group-hover:flex size-6 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem disabled>
            <Pencil className="size-3.5" />
            Переименовать
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault()
              setConfirmOpen(true)
            }}
          >
            <Trash2 className="size-3.5" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить чат?</AlertDialogTitle>
            <AlertDialogDescription>
              «{session.title || 'Новый чат'}» и все его сообщения будут удалены безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(session.id)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})
