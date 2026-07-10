import { memo } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '~/shared/lib/utils'
import { Button } from '~/shared/ui/button'
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
        'group flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-accent',
        isActive && 'bg-accent'
      )}
      onClick={() => onSelect(session.id)}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{session.title || 'New chat'}</p>
        <p className="text-xs text-muted-foreground">
          {session.message_count} messages
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
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              "{session.title || 'New chat'}" and all its messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(session.id)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})