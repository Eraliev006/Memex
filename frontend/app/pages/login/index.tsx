import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router'
import { getAuth } from '~/shared/api/generated/auth/auth'
import { Button } from '~/shared/ui/button'
import { Input } from '~/shared/ui/input'
import { Separator } from '~/shared/ui/separator'
import { AuthLayout } from '~/shared/ui/auth-layout'
import { GoogleButton } from '~/shared/ui/google-button'
import { useAuth } from '~/shared/lib/auth-context'


const { loginApiV1AuthLoginPost } = getAuth()

const loginSchema = z.object({
  username: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const { setAccessToken } = useAuth()

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await loginApiV1AuthLoginPost({
        username: data.username,
        password: data.password,
        grant_type: 'password',
        scope: '',
      })
      setAccessToken(response.data.access_token)
      navigate('/documents')
    } catch (e) {
      console.error('Login failed', e)
    }
  }

  return (
    <AuthLayout
      title="С возвращением"
      subtitle="Войдите в Memex"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Ещё нет аккаунта?{' '}
          <Link to="/registration" className="font-semibold text-foreground hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-label-foreground">Email</label>
          <Input type="email" placeholder="you@example.com" className="h-10 rounded-lg" {...register('username')} />
          {errors.username && <span className="text-xs text-destructive">{errors.username.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-label-foreground">Пароль</label>
          <Input type="password" placeholder="Минимум 6 символов" className="h-10 rounded-lg" {...register('password')} />
          {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
        </div>

        <Button type="submit" className="w-full h-10 rounded-lg mt-1.5" disabled={isSubmitting}>
          {isSubmitting ? 'Вход...' : 'Войти'}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-faint-foreground">или</span>
        <Separator className="flex-1" />
      </div>

      <GoogleButton />
    </AuthLayout>
  )
}
