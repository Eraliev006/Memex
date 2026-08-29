import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useParams } from 'react-router'
import { ArrowUp, MoreHorizontal } from 'lucide-react'
import { Button } from '~/shared/ui/button'
import { useSessions } from '~/entities/chat-session/model/use-sessions'
import { useMessages } from '~/entities/message/model/use-messages'
import { MessageBubble } from '~/entities/message/ui/message-bubble'
import { useSSEStream } from '~/shared/lib/streaming/use-sse-stream'
import { ErrorState } from '~/shared/ui/error-state'
import { cn } from '~/shared/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { ChatRequestSearchScope } from '~/shared/api/generated/model/chatRequestSearchScope'

const PROMPTS = [
  'Что мы решили по срокам релиза?',
  'Собери список рисков из всех документов',
  'О чём этот документ, кратко?',
  'Какие вопросы чаще всего поднимались?',
]

export function ChatPage() {
  const { sessionId } = useParams<{ sessionId?: string }>()
  const activeSessionId = sessionId ?? null
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: sessions } = useSessions()
  const { data: messages, isLoading: isMessagesLoading, isError: isMessagesError, refetch: refetchMessages } = useMessages(activeSessionId)

  const { status, text: streamingText, start } = useSSEStream()
  const isStreaming = status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  const queryClient = useQueryClient()

  const [optimisticMessage, setOptimisticMessage] = useState<string | null>(null)
  const [sendFailed, setSendFailed] = useState(false)

  const sendMessage = async (message: string) => {
    if (!activeSessionId || isStreaming) return
    setOptimisticMessage(message) // показываем сразу
    setSendFailed(false)

    // всегда 'both' — агент сам решает, звать ли qdrant_search/web_search
    // (tool_choice="auto" на бэке), в композере выбора нет намеренно
    const ok = await start(`/api/v1/chat/${activeSessionId}/message`, {
      message,
      search_scope: ChatRequestSearchScope.both,
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

  const hasThread = isMessagesLoading || !!messages?.length || !!optimisticMessage || isStreaming

  if (!hasThread) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center overflow-y-auto px-[22px] py-10">
        <div className="flex w-full max-w-[620px] flex-col gap-[26px]">
          <h1 className="font-heading text-[34px] font-normal leading-[1.2] tracking-[-0.01em] text-foreground">
            Что найдём?
          </h1>

          <div className="flex items-end gap-2 rounded-[22px] border border-border pl-4 pr-1.5 py-1.5">
            <textarea
              className="min-w-0 flex-1 resize-none border-none bg-transparent py-[11px] text-sm leading-[1.5] outline-none"
              placeholder="Спросите о своих документах"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <Button
              size="icon"
              className="size-8 shrink-0 rounded-full bg-invert-bg text-invert-foreground hover:opacity-85"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <ArrowUp className="size-[15px]" strokeWidth={2.2} />
            </Button>
          </div>

          <div className="flex flex-col">
            {PROMPTS.map((text) => (
              <button
                key={text}
                onClick={() => setInput(text)}
                className="border-b border-border py-3 px-1 text-left text-[13.5px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex h-[52px] shrink-0 items-center gap-2.5 px-[22px]">
        <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
          {activeSessionTitle}
        </span>
        <button className="flex size-7 shrink-0 items-center justify-center rounded-lg text-faint-foreground hover:bg-accent hover:text-foreground transition-colors">
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex flex-col gap-8 max-w-[680px] w-full mx-auto px-[22px] pt-4 pb-2">
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
            <div className="flex flex-col gap-1.5 items-end">
              <div className="max-w-[80%] rounded-[18px] bg-secondary px-[15px] py-2.5 text-sm leading-[1.55]">
                <p className="whitespace-pre-wrap break-words">{optimisticMessage}</p>
              </div>
              {sendFailed && (
                <div className="flex items-center gap-2 text-xs text-faint-foreground">
                  <span>Не удалось отправить</span>
                  <button type="button" className="underline hover:no-underline hover:text-foreground" onClick={handleRetrySend}>
                    Повторить
                  </button>
                </div>
              )}
            </div>
          )}
          {isStreaming && !streamingText && (
            <div className="text-[13.5px] text-faint-foreground animate-pulse">
              Ищу в документах…
            </div>
          )}
          {isStreaming && streamingText && (
            <div className="text-[14.5px] leading-[1.72] text-foreground whitespace-pre-wrap break-words">
              {streamingText}
              <span className="inline-block w-1.5 h-4 bg-current ml-0.5 align-middle animate-pulse" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 px-[22px] pt-2 pb-6">
        <div className="flex items-end gap-2 max-w-[680px] w-full mx-auto rounded-[22px] border border-border bg-background pl-4 pr-1.5 py-1.5">
          <textarea
            ref={textareaRef}
            className={cn(
              'min-w-0 flex-1 resize-none border-none bg-transparent py-[11px] text-sm leading-[1.5] outline-none',
              'max-h-[120px]'
            )}
            placeholder="Спросите о своих документах"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isStreaming}
          />
          <Button
            size="icon"
            className="size-8 shrink-0 rounded-full bg-invert-bg text-invert-foreground hover:opacity-85"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            <ArrowUp className="size-[15px]" strokeWidth={2.2} />
          </Button>
        </div>
      </div>
    </div>
  )
}
