import { memo, useState } from 'react'
import { cn } from '~/shared/lib/utils'
import type { MessageResponse, DocsSource, WebSource } from '~/shared/api/generated/model'
import { MessageStatus } from '~/shared/api/generated/model/messageStatus'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { FileText, Globe, TriangleAlert } from 'lucide-react'
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

type Source = DocsSource | WebSource

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

interface MessageBubbleProps {
  message: MessageResponse
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const sources = message.sources as Source[] | null
  const isMobile = useIsMobile()
  const isFailed = !isUser && message.status === MessageStatus.failed

  if (message.role === 'tool' || message.role === 'system') return null

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[18px] bg-secondary px-[15px] py-2.5 text-sm leading-[1.55]">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      {isFailed && !message.content ? (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <TriangleAlert className="size-3.5 shrink-0" />
          Не удалось получить ответ. Попробуйте ещё раз.
        </p>
      ) : (
        <div className="text-[14.5px] leading-[1.72] text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
          {/* без rehypeRaw: это ответ модели, а не наш документ — рендерить
              в нём сырой HTML небезопасно (модель могла нахвататься его из
              чужих загруженных документов через RAG-контекст) */}
          <ReactMarkdown>{message.content}</ReactMarkdown>
          {isFailed && (
            <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
              <TriangleAlert className="size-3 shrink-0" />
              Ответ прерван из-за ошибки
            </p>
          )}
        </div>
      )}

      {sources && sources.length > 0 && (
        <div className="flex flex-wrap gap-3.5 text-xs text-faint-foreground">
          {sources.map((source, i) => (
            <button
              key={i}
              onClick={() => setSelectedSource(source)}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              {source.source === 'web' ? (
                <>
                  <Globe className="size-3" strokeWidth={1.8} />
                  {getDomain(source.url)}
                </>
              ) : (
                <>
                  <FileText className="size-3" strokeWidth={1.8} />
                  {source.title || 'Документ'}
                  {source.page != null && ` · с. ${source.page}`}
                </>
              )}
            </button>
          ))}
        </div>
      )}

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
              {selectedSource?.source === 'web' ? <Globe className="size-4" /> : <FileText className="size-4" />}
              {selectedSource?.title || 'Документ'}
            </SheetTitle>
            {selectedSource?.source === 'web' && (
              <a
                href={selectedSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground underline hover:no-underline break-all"
              >
                {selectedSource.url}
              </a>
            )}
            {selectedSource?.score != null && (
              <p className="text-xs text-muted-foreground">
                {Math.round(selectedSource.score * 100)}% совпадение
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
              {selectedSource?.snippet ?? ''}
            </ReactMarkdown>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
})
