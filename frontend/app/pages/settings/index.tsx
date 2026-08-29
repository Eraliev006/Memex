import { useState } from 'react'
import { useNavigate } from 'react-router'
import axios from 'axios'
import { useMe } from '~/shared/lib/use-me'
import { useTheme, type Theme } from '~/shared/lib/use-theme'
import { useAuth } from '~/shared/lib/auth-context'
import { API_BASE_URL } from '~/shared/api/config/env'
import { cn } from '~/shared/lib/utils'

const themeOptions: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
  { value: 'system', label: 'Система' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-[21px] w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
        checked ? 'bg-invert-bg justify-end' : 'bg-accent justify-start'
      )}
    >
      <span className={cn('size-[17px] rounded-full', checked ? 'bg-invert-foreground' : 'bg-faint-foreground')} />
    </button>
  )
}

export function SettingsPage() {
  const { data: me } = useMe()
  const { theme, setTheme } = useTheme()
  const { setAccessToken } = useAuth()
  const navigate = useNavigate()

  // локальные настройки без бэкенд-состояния — README допускает это как necessary tweak
  const [showSources, setShowSources] = useState(true)
  const [autoTitle, setAutoTitle] = useState(false)

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/logout`, {}, { withCredentials: true })
    } catch {}
    setAccessToken(null)
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-[22px] pt-11 pb-14">
      <div className="max-w-[560px] w-full mx-auto flex flex-col gap-2">
        <h1 className="font-heading text-[30px] font-normal tracking-[-0.01em] text-foreground mb-[18px]">
          Настройки
        </h1>

        <div className="flex items-center justify-between gap-4 border-t border-border py-4">
          <span className="text-[13.5px]">Аккаунт</span>
          <span className="text-[13px] text-faint-foreground">{me?.email ?? ''}</span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border py-3.5">
          <span className="text-[13.5px]">Тема</span>
          <span className="flex shrink-0 gap-0.5 rounded-full bg-secondary p-0.5">
            {themeOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  'h-[26px] rounded-full px-3 text-xs transition-colors',
                  theme === value
                    ? 'bg-invert-bg text-invert-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border py-4">
          <span className="min-w-0">
            <span className="block text-[13.5px]">Источники под ответом</span>
            <span className="mt-[3px] block text-xs text-faint-foreground">Показывать, откуда взят ответ</span>
          </span>
          <Toggle checked={showSources} onChange={setShowSources} />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border py-4">
          <span className="min-w-0">
            <span className="block text-[13.5px]">Автоназвание чатов</span>
            <span className="mt-[3px] block text-xs text-faint-foreground">По первому вопросу в диалоге</span>
          </span>
          <Toggle checked={autoTitle} onChange={setAutoTitle} />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-b border-border py-4">
          <span className="text-[13.5px]">Выйти из аккаунта</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[13px] text-muted-foreground underline underline-offset-[3px] hover:text-foreground transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  )
}
