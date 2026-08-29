import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { FileText, MessageSquare, Settings, Network, Plus } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '~/shared/ui/sidebar'
import { ErrorState } from '~/shared/ui/error-state'
import { ThemeToggle } from '~/shared/ui/theme-toggle'
import { useMe } from '~/shared/lib/use-me'
import { useSessions, useCreateSession, useDeleteSession } from '~/entities/chat-session/model/use-sessions'
import { SessionListItem } from '~/entities/chat-session/ui/session-list-item'
import type { ChatSessionResponse } from '~/shared/api/generated/model'

const nav = [
  { to: '/chat', icon: MessageSquare, label: 'Чаты' },
  { to: '/documents', icon: FileText, label: 'Документы' },
  { to: '/knowledge-graph', icon: Network, label: 'Граф' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
]

function groupSessions(sessions: ChatSessionResponse[]) {
  const now = Date.now()
  const groups: { label: string; items: ChatSessionResponse[] }[] = [
    { label: 'Сегодня', items: [] },
    { label: 'На этой неделе', items: [] },
    { label: 'Раньше', items: [] },
  ]
  for (const s of sessions) {
    const ts = new Date(s.last_message_at || s.created_at).getTime()
    const days = (now - ts) / 86_400_000
    const bucket = days < 1 ? 0 : days < 7 ? 1 : 2
    groups[bucket].items.push(s)
  }
  return groups.filter((g) => g.items.length > 0)
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: me } = useMe()

  const { sessionId } = useParams<{ sessionId?: string }>()
  const { data: sessions, isError: isSessionsError, refetch: refetchSessions } = useSessions()
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

  const groups = groupSessions(sessions ?? [])

  return (
    <SidebarProvider className="h-dvh overflow-hidden">
      <Sidebar collapsible="none" className="border-r-0">
        <SidebarHeader className="px-4 pt-[18px] pb-3">
          <Link to="/chat" className="flex items-center gap-[9px]">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-invert-bg font-heading text-[15px] leading-none text-invert-foreground">
              M
            </span>
            <span className="text-sm font-semibold tracking-[-0.01em]">Memex</span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="gap-0">
          <SidebarMenu className="px-2 gap-px">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleNewChat}
                className="h-[34px] gap-2.5 rounded-[9px] px-2 text-[13.5px] text-foreground hover:bg-accent"
              >
                <Plus className="size-4" strokeWidth={1.8} />
                Новый чат
              </SidebarMenuButton>
            </SidebarMenuItem>
            {nav.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname.startsWith(to)
              return (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="h-[34px] gap-2.5 rounded-[9px] px-2 text-[13.5px] text-muted-foreground hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-foreground"
                  >
                    <Link to={to}>
                      <Icon className="size-4" strokeWidth={1.8} />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>

          <div className="flex flex-1 min-h-0 flex-col gap-px overflow-y-auto px-2 pt-4 pb-2">
            {isSessionsError ? (
              <ErrorState message="Не удалось загрузить чаты" onRetry={() => refetchSessions()} />
            ) : (
              groups.map((group) => (
                <div key={group.label}>
                  <div className="px-2 pt-3 pb-[5px] text-[11.5px] text-faint-foreground">{group.label}</div>
                  {group.items.map((session) => (
                    <SessionListItem
                      key={session.id}
                      session={session}
                      isActive={sessionId === session.id}
                      onSelect={handleSelectSession}
                      onDelete={handleDeleteSession}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </SidebarContent>

        <SidebarFooter className="flex-row items-center gap-2 p-2">
          <Link
            to="/settings"
            className="flex h-[38px] min-w-0 flex-1 items-center gap-[9px] rounded-[9px] px-2 hover:bg-accent"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold">
              {me?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-medium">{me?.name ?? 'Аккаунт'}</span>
              <span className="block truncate text-[11px] text-faint-foreground">{me?.email ?? ''}</span>
            </span>
          </Link>
          <ThemeToggle className="size-[30px] shrink-0 rounded-[9px] text-faint-foreground hover:bg-accent hover:text-foreground" />
        </SidebarFooter>
      </Sidebar>

      <div className="flex flex-1 min-w-0 flex-col min-h-0 bg-background">
        {children}
      </div>
    </SidebarProvider>
  )
}
