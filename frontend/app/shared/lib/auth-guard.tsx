import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '~/shared/lib/auth-context'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  return <>{children}</>
}