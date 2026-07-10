import { useQuery } from '@tanstack/react-query'
import { getChat } from '~/shared/api/generated/chat/chat'

const { getMessagesApiV1ChatSessionIdMessagesGet } = getChat()

export function useMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () => getMessagesApiV1ChatSessionIdMessagesGet(sessionId!),
    select: (res) => res.data.items,
    enabled: !!sessionId,
  })
}