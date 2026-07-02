import { useQuery } from '@tanstack/react-query'
import { getDocument } from '~/shared/api/generated/document/document'

const { listDocumentsApiV1DocumentGet } = getDocument()

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => listDocumentsApiV1DocumentGet(),
    select: (res) => res.data,
  })
}