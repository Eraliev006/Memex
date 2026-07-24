import type { DocumentStatuses } from '~/shared/api/generated/model'

export function getStatusBadgeClass(status: DocumentStatuses): string {
  switch (status) {
    case 'ready': return 'bg-accent text-accent-foreground'
    case 'processing': return 'bg-muted text-muted-foreground'
    case 'pending': return 'bg-muted text-muted-foreground'
    case 'failed': return 'bg-danger-bg text-danger-foreground'
  }
}

export function getStatusLabel(status: DocumentStatuses): string {
  switch (status) {
    case 'ready': return 'Готов'
    case 'processing': return 'Индексация'
    case 'pending': return 'В очереди'
    case 'failed': return 'Ошибка'
  }
}
