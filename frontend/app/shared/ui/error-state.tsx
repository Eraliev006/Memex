import { AlertCircle } from 'lucide-react'
import { Button } from '~/shared/ui/button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message = 'Something went wrong', onRetry, className }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground ${className ?? ''}`}>
      <AlertCircle className="size-8 text-destructive" />
      <p className="text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
