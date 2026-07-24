import { useNavigate } from 'react-router'
import { Sun, Moon, Monitor } from 'lucide-react'
import axios from 'axios'
import { useMe } from '~/shared/lib/use-me'
import { useTheme, type Theme } from '~/shared/lib/use-theme'
import { useAuth } from '~/shared/lib/auth-context'
import { API_BASE_URL } from '~/shared/api/config/env'
import { Button } from '~/shared/ui/button'
import { Input } from '~/shared/ui/input'
import { cn } from '~/shared/lib/utils'

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: Monitor },
]

export function SettingsPage() {
  const { data: me } = useMe()
  const { theme, setTheme } = useTheme()
  const { setAccessToken } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/logout`, {}, { withCredentials: true })
    } catch {}
    setAccessToken(null)
    navigate('/login', { replace: true })
  }

  return (
    <div className="p-8 flex justify-center">
      <div className="w-full max-w-[640px] flex flex-col gap-7 pb-14">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Настройки</h1>
          <p className="text-[13.5px] text-muted-foreground mt-1">Профиль, тема и параметры аккаунта</p>
        </div>

        <section className="border rounded-2xl p-5.5 flex flex-col gap-4">
          <h2 className="text-[14.5px] font-semibold">Профиль</h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-label-foreground">Имя</label>
            <Input value={me?.name ?? ''} readOnly className="h-9.5 rounded-lg bg-muted/50" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-label-foreground">Email</label>
            <Input value={me?.email ?? ''} readOnly className="h-9.5 rounded-lg bg-muted/50" />
          </div>
        </section>

        <section className="border rounded-2xl p-5.5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[14.5px] font-semibold mb-0.5">Тема</h2>
            <p className="text-xs text-muted-foreground">Следует системной теме устройства, можно переопределить</p>
          </div>
          <div className="flex gap-1 border rounded-lg p-1 shrink-0">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                title={label}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex items-center justify-center size-8 rounded-md transition-colors',
                  theme === value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </section>

        <section className="border border-danger-border bg-danger-bg rounded-2xl p-5.5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[14.5px] font-semibold mb-0.5 text-danger-foreground">Выйти из аккаунта</h2>
            <p className="text-xs text-danger-foreground-2">Завершить сессию на этом устройстве</p>
          </div>
          <Button
            variant="outline"
            className="border-danger-border text-danger-foreground hover:text-danger-foreground shrink-0"
            onClick={handleLogout}
          >
            Выйти
          </Button>
        </section>
      </div>
    </div>
  )
}
