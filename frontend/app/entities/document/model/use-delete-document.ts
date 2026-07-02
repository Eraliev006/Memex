import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDocument } from '~/shared/api/generated/document/document'

const { deleteDocumentApiV1DocumentDocumentIdDelete } = getDocument()

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) =>
      deleteDocumentApiV1DocumentDocumentIdDelete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}