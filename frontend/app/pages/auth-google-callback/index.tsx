import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { getAuth } from '~/shared/api/generated/auth/auth'
import { useAuth } from '~/shared/lib/auth-context'
import { ErrorState } from '~/shared/ui/error-state'
import { Button } from '~/shared/ui/button'

const { loginWithGoogleApiV1AuthLoginGooglePost } = getAuth()

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAccessToken } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const requestStarted = useRef(false)

  useEffect(() => {
    if (requestStarted.current) return
    requestStarted.current = true

    const googleError = searchParams.get('error')
    const code = searchParams.get('code')

    if (googleError) {
      setError('Google отклонил вход')
      return
    }

    if (!code) {
      setError('Код авторизации не найден')
      return
    }

    loginWithGoogleApiV1AuthLoginGooglePost({ code })
      .then((response) => {
        setAccessToken(response.data.access_token)
        navigate('/documents', { replace: true })
      })
      .catch(() => {
        setError('Не удалось войти через Google')
      })
  }, [searchParams, navigate, setAccessToken])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4">
          <ErrorState message={error} />
          <Button variant="outline" asChild>
            <Link to="/login">Вернуться к логину</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
    </div>
  )
}
