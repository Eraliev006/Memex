import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { PanelLeft, PlusCircle, Send } from 'lucide-react'
import { Button } from '~/shared/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/shared/ui/sheet'
import { useSessions, useCreateSession, useDeleteSession } from '~/entities/chat-session/model/use-sessions'
import { useMessages } from '~/entities/message/model/use-messages'
import { MessageBubble } from '~/entities/message/ui/message-bubble'
import { SessionListItem } from '~/entities/chat-session/ui/session-list-item'
import { useSSEStream } from '~/shared/lib/streaming/use-sse-stream'
import { ErrorState } from '~/shared/ui/error-state'
import { cn } from '~/shared/lib/utils'
import { useQueryClient } from '@tanstack/react-query'

export function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false)

  const { data: sessions, isError: isSessionsError, refetch: refetchSessions } = useSessions()
  const { data: messages, isLoading: isMessagesLoading, isError: isMessagesError, refetch: refetchMessages } = useMessages(activeSessionId)
  const { mutate: createSession } = useCreateSession()
  const { mutate: deleteSession } = useDeleteSession()

  const { status, text: streamingText, start } = useSSEStream()
  const isStreaming = status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const handleNewChat = () => {
    createSession('new chat', {
      onSuccess: (res) => {
        setActiveSessionId(res.data.id)
        setMobileSessionsOpen(false)
      },
    })
  }
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

  // useCallback здесь важен: без него identity колбэков менялась бы на
  // каждый рендер (в т.ч. на каждый keystroke в textarea) и React.memo на
  // SessionListItem не спасал бы от лишних ре-рендеров списка чатов
  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id)
    setMobileSessionsOpen(false)
  }, [])

  const handleDeleteSession = useCallback((id: string) => {
    deleteSession(id)
    setActiveSessionId((current) => (current === id ? null : current))
  }, [deleteSession])

  const sessionsList = (
    <>
      <div className="p-3 border-b">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleNewChat}
        >
          <PlusCircle className="size-4" />
          New chat
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-2 flex flex-col gap-1">
        {isSessionsError ? (
          <ErrorState message="Failed to load chats" onRetry={() => refetchSessions()} />
        ) : (
          sessions?.map((session) => (
            <SessionListItem
              key={session.id}
              session={session}
              isActive={activeSessionId === session.id}
              onSelect={handleSelectSession}
              onDelete={handleDeleteSession}
            />
          ))
        )}
      </div>
    </>
  )

  const activeSessionTitle = sessions?.find((s) => s.id === activeSessionId)?.title

  return (
    <div className="flex h-full min-h-0">
      {/* Sessions sidebar (desktop) */}
      <div className="hidden md:flex w-64 border-r flex-col shrink-0 min-h-0">
        {sessionsList}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 border-b p-3 md:hidden shrink-0">
          <Sheet open={mobileSessionsOpen} onOpenChange={setMobileSessionsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <PanelLeft className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <SheetHeader className="border-b">
                <SheetTitle>Chats</SheetTitle>
              </SheetHeader>
              {sessionsList}
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium truncate">
            {activeSessionId ? activeSessionTitle ?? 'Chat' : 'Select a chat'}
          </span>
        </div>

        {!activeSessionId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">Select a chat or create new</p>
              <p className="text-sm mt-1">Start by clicking "New chat"</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 flex flex-col gap-4">
              {isMessagesError ? (
                <ErrorState message="Failed to load messages" onRetry={() => refetchMessages()} />
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium bg-primary text-primary-foreground">
                      U
                    </div>
                    <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-primary text-primary-foreground rounded-tr-sm">
                      <p className="whitespace-pre-wrap break-words">{optimisticMessage}</p>
                    </div>
                  </div>
                  {sendFailed && (
                    <div className="flex items-center gap-2 pr-11 text-xs text-destructive">
                      <span>Failed to send</span>
                      <button type="button" className="underline hover:no-underline" onClick={handleRetrySend}>
                        Retry
                      </button>
                    </div>
                  )}
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

            <div className="border-t p-4">
              <div className="flex gap-2 items-end">
                <textarea
                  className={cn(
                    'flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors',
                    'focus:border-ring min-h-[48px] max-h-32'
                  )}
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={isStreaming}
                />
                <Button
                  size="icon"
                  className="size-12 rounded-xl shrink-0"
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}