import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getChat } from '~/shared/api/generated/chat/chat'

const {
  listSessionsApiV1ChatSessionsGet,
  createSessionApiV1ChatSessionsPost,
  deleteSessionApiV1ChatSessionsSessionIdDelete,
} = getChat()

export function useSessions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => listSessionsApiV1ChatSessionsGet(),
    select: (res) => res.data.items,
    enabled: options?.enabled,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title: string) =>
      createSessionApiV1ChatSessionsPost({ title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      deleteSessionApiV1ChatSessionsSessionIdDelete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}