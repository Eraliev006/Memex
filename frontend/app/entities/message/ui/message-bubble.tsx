import { memo, useState } from 'react'
import { cn } from '~/shared/lib/utils'
import type { MessageResponse } from '~/shared/api/generated/model'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/shared/ui/sheet'
import { useIsMobile } from '~/shared/lib/hooks/use-mobile'

// у документов LlamaParse таблицы приходят как сырой HTML внутри markdown —
// rehypeRaw их рендерит, rehypeSanitize режет всё, что не таблица/форматирование
// (важно: это чужой пользовательский контент, а не наш собственный markdown)
const sourcePlugins = [rehypeRaw, rehypeSanitize]

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

interface Source {
  document_title?: string
  text: string
  score?: number
  chunk_index?: number
}

interface MessageBubbleProps {
  message: MessageResponse
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [showSources, setShowSources] = useState(false)
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const sources = message.sources as Source[] | null
  const isMobile = useIsMobile()

  if (message.role === 'tool' || message.role === 'system') return null

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      <div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start', 'max-w-[80%]')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
              {/* без rehypeRaw: это ответ модели, а не наш документ — рендерить
                  в нём сырой HTML небезопасно (модель могла нахвататься его из
                  чужих загруженных документов через RAG-контекст) */}
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && sources && sources.length > 0 && (
          <div className="flex flex-col gap-1 w-full">
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
              onClick={() => setShowSources(!showSources)}
            >
              <FileText className="size-3" />
              {sources.length} source{sources.length > 1 ? 's' : ''}
              {showSources ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>

            {showSources && (
              <div className="flex flex-col gap-2 w-full">
                {sources.map((source, i) => (
                  <div
                    key={i}
                    className="rounded-lg border bg-background px-3 py-2 text-xs flex flex-col gap-1 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedSource(source)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {source.document_title || 'Document'}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {Math.round((source.score ?? 0) * 100)}% match
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-3">
                      {stripHtml(source.text)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Source detail sheet: снизу на мобильных (полная ширина, удобно
          дотягиваться большим пальцем), справа и шире на десктопе для
          чтения таблиц */}
      <Sheet open={!!selectedSource} onOpenChange={() => setSelectedSource(null)}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={cn(
            'overflow-auto',
            isMobile ? 'h-[85vh] w-full' : 'w-full sm:max-w-xl'
          )}
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              {selectedSource?.document_title || 'Document'}
            </SheetTitle>
            {selectedSource?.score != null && (
              <p className="text-xs text-muted-foreground">
                {Math.round(selectedSource.score * 100)}% match
              </p>
            )}
          </SheetHeader>
          <div
            className={cn(
              'mt-4 prose prose-sm dark:prose-invert max-w-none overflow-x-auto px-4 pb-4',
              'prose-table:w-full prose-table:border prose-table:border-border prose-table:border-collapse',
              'prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:align-top',
              'prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:align-top'
            )}
          >
            <ReactMarkdown rehypePlugins={sourcePlugins}>
              {selectedSource?.text ?? ''}
            </ReactMarkdown>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
})