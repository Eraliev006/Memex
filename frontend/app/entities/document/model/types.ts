export type DocumentStatus = 'ready' | 'processing' | 'pending' | 'failed'

export function getStatusColor(status: DocumentStatus): string {
  switch (status) {
    case 'ready': return 'text-green-500'
    case 'processing': return 'text-yellow-500'
    case 'pending': return 'text-blue-500'
    case 'failed': return 'text-red-500'
  }
}

export function getStatusLabel(status: DocumentStatus): string {
  switch (status) {
    case 'ready': return 'Ready'
    case 'processing': return 'Processing'
    case 'pending': return 'Pending'
    case 'failed': return 'Failed'
  }
}