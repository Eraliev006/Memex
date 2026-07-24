import { Link } from 'react-router'
import { Brain } from 'lucide-react'
import { ThemeToggle } from '~/shared/ui/theme-toggle'

const features = [
  { icon: '🔗', title: 'Ссылки на источники', desc: 'Каждый ответ ссылается на документ и конкретный фрагмент, из которого он взят.' },
  { icon: '🔍', title: 'RAG-поиск по документам', desc: 'Векторный поиск на Qdrant — задавайте вопросы своими словами, без точных совпадений.' },
  { icon: '💬', title: 'Потоковые ответы', desc: 'Ответ стримится токен за токеном через SSE, как в обычном чате с ассистентом.' },
  { icon: '📄', title: 'PDF, MD, TXT, DOCX', desc: 'Загружайте документы любым из этих форматов — парсинг и индексация идут в фоне.' },
  { icon: '🐳', title: 'Self-hosted', desc: 'Открытый исходный код на FastAPI + React — разверни у себя, данные остаются твоими.' },
  { icon: '⭐', title: 'Open-source', desc: 'Полностью открытый код — форкай, дорабатывай, вноси свой вклад.' },
]

export function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <header className="flex items-center justify-between px-6 sm:px-14 py-5 border-b">
        <div className="flex items-center gap-2 font-bold text-[17px] tracking-tight">
          <div className="bg-primary text-primary-foreground flex size-[22px] items-center justify-center rounded-[7px]">
            <Brain className="size-3.5" />
          </div>
          Memex
        </div>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hidden sm:inline hover:text-foreground transition-colors">Возможности</a>
          <a
            href="https://github.com/Eraliev006/memex"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <ThemeToggle />
          <Link
            to="/login"
            className="px-3.5 py-1.5 rounded-lg bg-invert-bg text-invert-foreground font-medium text-sm"
          >
            Войти
          </Link>
        </nav>
      </header>

      <div className="relative flex flex-col items-center text-center px-6 pt-16 pb-2 gap-5">
        <div className="absolute -top-15 left-1/2 -translate-x-1/2 w-[560px] h-[280px] bg-[radial-gradient(closest-side,var(--accent),transparent)] opacity-10 pointer-events-none" />
        <div className="relative inline-flex items-center gap-1.5 text-xs text-muted-foreground border rounded-full px-3 py-1.5">
          <span className="size-1.5 rounded-full bg-primary" /> v0.1 · open-source
        </div>
        <h1 className="relative text-3xl sm:text-[46px] leading-[1.08] tracking-tight font-bold max-w-[680px]">
          Твой второй мозг. Со ссылками на источники.
        </h1>
        <p className="relative text-base leading-relaxed text-muted-foreground max-w-[520px]">
          Личная база знаний: загружай документы, задавай вопросы своими словами
          и получай ответы с точной ссылкой на источник — без выдумывания фактов.
        </p>
        <div className="relative flex gap-3 mt-1">
          <Link
            to="/registration"
            className="px-5.5 py-2.5 rounded-[10px] bg-primary text-primary-foreground font-semibold text-[14.5px] no-underline"
          >
            Начать бесплатно
          </Link>
          <a
            href="https://github.com/Eraliev006/memex"
            target="_blank"
            rel="noreferrer"
            className="px-5.5 py-2.5 rounded-[10px] border font-medium text-[14.5px] no-underline"
          >
            ★ GitHub
          </a>
        </div>
      </div>

      <div className="px-6 sm:px-14 pt-10">
        <div className="max-w-3xl mx-auto border rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b bg-muted/60">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </div>
            <span className="text-[11px] text-muted-foreground">Чат</span>
          </div>
          <div className="flex h-[260px]">
            <div className="w-[180px] border-r p-3.5 hidden sm:flex flex-col gap-2">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Чаты</div>
              <div className="px-2.5 py-2 rounded-lg bg-muted text-[12.5px]">Финансовый отчёт Q3</div>
              <div className="px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground">Договор аренды</div>
              <div className="px-2.5 py-2 rounded-lg text-[12.5px] text-muted-foreground">Заметки по курсу ML</div>
            </div>
            <div className="flex-1 p-4 flex flex-col gap-2.5 justify-end">
              <div className="self-end max-w-[78%] bg-invert-bg text-invert-foreground px-3.5 py-2 rounded-[12px_12px_2px_12px] text-[12.5px]">
                Какая выручка была в Q3 по сравнению с Q2?
              </div>
              <div className="self-start max-w-[85%] bg-muted px-3.5 py-2 rounded-[12px_12px_12px_2px] text-[12.5px] leading-relaxed">
                Выручка в Q3 выросла на 18%, до $4.2M.
                <div className="mt-1.5 flex gap-1.5">
                  <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-background border text-muted-foreground">📄 Q3-report.pdf</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="features" className="px-6 sm:px-14 py-20">
        <h2 className="text-center text-[28px] font-bold tracking-tight mb-10">Всё, что нужно для работы со знаниями</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="border rounded-2xl p-6">
              <div className="size-[30px] rounded-lg bg-accent flex items-center justify-center text-sm mb-3.5">{f.icon}</div>
              <h3 className="text-[15px] font-semibold mb-2">{f.title}</h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-6 sm:mx-14 mb-14 p-10 sm:p-14 rounded-[20px] bg-muted flex flex-col items-center text-center gap-4">
        <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight">Готов превратить документы в базу знаний?</h2>
        <p className="text-[14.5px] text-muted-foreground max-w-[420px]">
          Загрузи первый документ и задай ему вопрос — бесплатно.
        </p>
        <Link
          to="/registration"
          className="px-7 py-3 rounded-[10px] bg-primary text-primary-foreground font-semibold text-[15px] no-underline"
        >
          Начать бесплатно
        </Link>
      </div>

      <footer className="flex items-center justify-center gap-7 py-5.5 border-t text-xs text-faint-foreground">
        <span>FastAPI</span><span>Qdrant</span><span>PostgreSQL</span><span>React</span><span>Docker</span>
      </footer>
    </div>
  )
}
