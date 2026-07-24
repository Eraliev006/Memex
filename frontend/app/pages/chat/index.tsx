import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useParams } from 'react-router'
import { Send } from 'lucide-react'
import { Button } from '~/shared/ui/button'
import { useSessions } from '~/entities/chat-session/model/use-sessions'
import { useMessages } from '~/entities/message/model/use-messages'
import { MessageBubble } from '~/entities/message/ui/message-bubble'
import { useSSEStream } from '~/shared/lib/streaming/use-sse-stream'
import { ErrorState } from '~/shared/ui/error-state'
import { cn } from '~/shared/lib/utils'
import { useQueryClient } from '@tanstack/react-query'

export function ChatPage() {
  const { sessionId } = useParams<{ sessionId?: string }>()
  const activeSessionId = sessionId ?? null
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: sessions } = useSessions()
  const { data: messages, isLoading: isMessagesLoading, isError: isMessagesError, refetch: refetchMessages } = useMessages(activeSessionId)

  const { status, text: streamingText, start } = useSSEStream()
  const isStreaming = status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const queryClient = useQueryClient()

  const [optimisticMessage, setOptimisticMessage] = useState<string | null>(null)
  const [sendFailed, setSendFailed] = useState(false)

  const sendMessage = async (message: string) => {
    if (!activeSessionId || isStreaming) return
    setOptimisticMessage(message) // показываем сразу
    setSendFailed(false)

    const ok = await start(`/api/v1/chat/${activeSessionId}/message`, {
      message,
    })

    if (ok) {
      setOptimisticMessage(null)
      queryClient.invalidateQueries({ queryKey: ['messages', activeSessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    } else {
      // сообщение не доставлено — оставляем пузырь и даём возможность повторить,
      // а не молча его прятать
      setSendFailed(true)
    }
  }

  const handleSend = () => {
    if (!input.trim() || !activeSessionId || isStreaming) return
    const message = input.trim()
    setInput('')
    sendMessage(message)
  }

  const handleRetrySend = () => {
    if (optimisticMessage) sendMessage(optimisticMessage)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const activeSessionTitle = sessions?.find((s) => s.id === activeSessionId)?.title

  if (!activeSessionId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">Выберите чат или создайте новый</p>
          <p className="text-sm mt-1">Нажмите «Новый чат» в боковой панели, чтобы начать</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {activeSessionTitle && (
        <div className="flex items-center px-4 sm:px-7 py-4 border-b shrink-0">
          <span className="text-[14.5px] font-semibold truncate">{activeSessionTitle}</span>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 flex flex-col gap-4 max-w-[760px] w-full mx-auto">
        {isMessagesError ? (
          <ErrorState message="Не удалось загрузить сообщения" onRetry={() => refetchMessages()} />
        ) : isMessagesLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          messages?.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        {optimisticMessage && (
          <div className="flex flex-col gap-1 items-end">
            <div className="flex gap-3 flex-row-reverse">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium bg-invert-bg text-invert-foreground">
                U
              </div>
              <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-invert-bg text-invert-foreground rounded-tr-sm">
                <p className="whitespace-pre-wrap break-words">{optimisticMessage}</p>
              </div>
            </div>
            {sendFailed && (
              <div className="flex items-center gap-2 pr-11 text-xs text-destructive">
                <span>Не удалось отправить</span>
                <button type="button" className="underline hover:no-underline" onClick={handleRetrySend}>
                  Повторить
                </button>
              </div>
            )}
          </div>
        )}
        {isStreaming && !streamingText && (
          <div className="flex items-center gap-2 text-muted-foreground text-[13px]">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Агент печатает…
          </div>
        )}
        {isStreaming && streamingText && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium bg-muted text-muted-foreground">
              AI
            </div>
            <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-muted text-foreground rounded-tl-sm">
              <p className="whitespace-pre-wrap break-words">{streamingText}</p>
              <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 sm:px-6 sm:pb-6 sm:pt-4.5 max-w-[760px] w-full mx-auto">
        <div className="flex gap-2.5 items-end border rounded-2xl pl-4 pr-2 py-2">
          <textarea
            className={cn(
              'flex-1 resize-none border-none bg-transparent px-0 py-2 text-sm outline-none',
              'min-h-[24px] max-h-32'
            )}
            placeholder="Спросите что-нибудь о ваших документах…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isStreaming}
          />
          <Button
            size="icon"
            className="size-9.5 rounded-[10px] shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
