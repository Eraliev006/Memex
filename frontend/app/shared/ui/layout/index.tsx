import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { FileText, MessageSquare, Settings, Network, Brain, LogOut, Sun, Moon, Monitor, PlusCircle } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '~/shared/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '~/shared/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '~/shared/ui/avatar'
import { Button } from '~/shared/ui/button'
import { ErrorState } from '~/shared/ui/error-state'
import { useState } from 'react'
import { useAuth } from '~/shared/lib/auth-context'
import { useMe } from '~/shared/lib/use-me'
import { useTheme } from '~/shared/lib/use-theme'
import { API_BASE_URL } from '~/shared/api/config/env'
import axios from 'axios'
import { useSessions, useCreateSession, useDeleteSession } from '~/entities/chat-session/model/use-sessions'
import { SessionListItem } from '~/entities/chat-session/ui/session-list-item'


const nav = [
  { to: '/documents', icon: FileText, label: 'Документы' },
  { to: '/chat', icon: MessageSquare, label: 'Чат' },
  { to: '/knowledge-graph', icon: Network, label: 'Knowledge Graph' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { setAccessToken } = useAuth()
  const [open, setOpen] = useState(true)
  const { data: me } = useMe()

  const isChatSection = location.pathname.startsWith('/chat')
  const { sessionId } = useParams<{ sessionId?: string }>()
  const { data: sessions, isError: isSessionsError, refetch: refetchSessions } = useSessions({ enabled: isChatSection })
  const { mutate: createSession } = useCreateSession()
  const { mutate: deleteSession } = useDeleteSession()

  const handleNewChat = () => {
    createSession('new chat', {
      onSuccess: (res) => navigate(`/chat/${res.data.id}`),
    })
  }

  const handleSelectSession = (id: string) => navigate(`/chat/${id}`)

  const handleDeleteSession = (id: string) => {
    deleteSession(id)
    if (sessionId === id) navigate('/chat')
  }

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/logout`, {}, { withCredentials: true })
    } catch {}
    setAccessToken(null)
    navigate('/login', { replace: true })
  }

  return (
    <SidebarProvider open={open} onOpenChange={setOpen} className="h-dvh overflow-hidden">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/documents" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Brain className="size-4" />
                  </div>
                  <span className="font-semibold">Memex</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu className="px-2 mt-2">
            {nav.map(({ to, icon: Icon, label }) => (
              <SidebarMenuItem key={to}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith(to)}
                  tooltip={label}
                >
                  <Link to={to} onClick={(e) => e.stopPropagation()}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          {isChatSection && (
            <div className="flex flex-col flex-1 min-h-0 mt-2 px-2 gap-1 group-data-[collapsible=icon]:hidden">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-lg mb-1"
                onClick={handleNewChat}
              >
                <PlusCircle className="size-4" />
                Новый чат
              </Button>
              <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-1">
                {isSessionsError ? (
                  <ErrorState message="Не удалось загрузить чаты" onRetry={() => refetchSessions()} />
                ) : (
                  sessions?.map((session) => (
                    <SessionListItem
                      key={session.id}
                      session={session}
                      isActive={sessionId === session.id}
                      onSelect={handleSelectSession}
                      onDelete={handleDeleteSession}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {me?.name?.charAt(0).toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{me?.name ?? 'Аккаунт'}</span>
                      <span className="truncate text-xs text-muted-foreground">{me?.email ?? ''}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-48">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {theme === 'dark' ? <Moon className="size-4" /> : theme === 'light' ? <Sun className="size-4" /> : <Monitor className="size-4" />}
                      <span>Тема</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme('light')}>
                        <Sun className="size-4" /> Светлая
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')}>
                        <Moon className="size-4" /> Тёмная
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('system')}>
                        <Monitor className="size-4" /> Системная
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="size-4" />
                    <span>Выйти</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <header className="flex h-12 items-center border-b px-4 shrink-0">
          <SidebarTrigger />
        </header>
        <main className="flex-1 min-h-0 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}