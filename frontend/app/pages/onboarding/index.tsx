import { Link, useNavigate } from 'react-router'
import { Brain } from 'lucide-react'
import { useMe } from '~/shared/lib/use-me'
import { useDocuments } from '~/entities/document/model/use-documents'
import { useSessions } from '~/entities/chat-session/model/use-sessions'
import { UploadZone } from '~/features/upload-document/ui/upload-zone'
import { cn } from '~/shared/lib/utils'

export function OnboardingPage() {
  const { data: me } = useMe()
  const { data: documents } = useDocuments()
  const { data: sessions } = useSessions()
  const navigate = useNavigate()

  const hasDocument = (documents?.length ?? 0) > 0
  const hasAskedQuestion = sessions?.some((s) => s.message_count > 0) ?? false
  const firstName = me?.name?.split(' ')[0]

  const steps = [
    { title: 'Аккаунт создан', desc: 'Email подтверждён', done: true },
    { title: 'Загрузите документ', desc: 'PDF, MD, TXT или DOCX', done: hasDocument },
    { title: 'Задайте первый вопрос', desc: 'Агент ответит со ссылкой на источник', done: hasAskedQuestion },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground px-6">
      <header className="w-full max-w-[560px] flex items-center justify-between py-5">
        <div className="flex items-center gap-2 font-bold text-base tracking-tight">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-[7px]">
            <Brain className="size-3.5" />
          </div>
          Memex
        </div>
        <Link to="/documents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Пропустить
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[560px] gap-9 py-5 pb-15">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-full px-2.5 py-1">
            <span className="size-1.5 rounded-full bg-primary" /> Шаг 1 из 1
          </div>
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight">
            Добро пожаловать{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-[14.5px] text-muted-foreground max-w-[400px]">
            Аккаунт создан. Загрузите первый документ, и через пару минут сможете задать ему вопрос.
          </p>
        </div>

        <div className="w-full">
          <UploadZone />
        </div>

        <div className="w-full flex flex-col gap-2.5">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-center gap-3 px-3.5 py-3 border rounded-[11px]">
              <div
                className={cn(
                  'size-6 rounded-[7px] shrink-0 flex items-center justify-center text-xs font-semibold',
                  step.done ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {step.done ? '✓' : i + 1}
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[13.5px] font-semibold">{step.title}</span>
                <span className="text-xs text-muted-foreground">{step.desc}</span>
              </div>
              {step.done && <span className="text-xs font-semibold text-primary">Готово</span>}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate('/documents')}
          className="w-full text-center py-3 rounded-[10px] border font-medium text-sm"
        >
          Перейти в документы без загрузки →
        </button>
      </div>
    </div>
  )
}
