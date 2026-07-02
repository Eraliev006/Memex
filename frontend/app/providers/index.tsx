import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { AuthProvider, useAuth } from '~/shared/lib/auth-context'
import { setAccessToken } from '~/shared/api/config/axios-instance'
import { TooltipProvider } from '~/shared/ui/tooltip'
import axios from 'axios'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
})

function AppInitializer({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const { setAccessToken } = useAuth()

  useEffect(() => {
    axios.post('http://localhost:8000/api/v1/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.access_token)
      })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [])

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
    </div>
  )

  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppInitializer>
            {children}
          </AppInitializer>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}