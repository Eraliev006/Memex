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


const { registerApiV1AuthRegisterPost, loginApiV1AuthLoginPost } = getAuth()

const registrationSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

type RegistrationForm = z.infer<typeof registrationSchema>

export function RegistrationPage() {
  const navigate = useNavigate()
  const { setAccessToken } = useAuth()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
  })

  const onSubmit = async (data: RegistrationForm) => {
    try {
      await registerApiV1AuthRegisterPost({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      const loginResponse = await loginApiV1AuthLoginPost({
        username: data.email,
        password: data.password,
        grant_type: 'password',
        scope: '',
      })
      setAccessToken(loginResponse.data.access_token)
      navigate('/onboarding')
    } catch (e) {
      console.error('Registration failed', e)
    }
  }

  return (
    <AuthLayout
      title="Создать аккаунт"
      subtitle="Начните строить свою базу знаний"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-foreground hover:underline">
            Войти
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-label-foreground">Имя</label>
          <Input type="text" placeholder="Как к вам обращаться" className="h-10 rounded-lg" {...register('name')} />
          {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-label-foreground">Email</label>
          <Input type="email" placeholder="you@example.com" className="h-10 rounded-lg" {...register('email')} />
          {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-label-foreground">Пароль</label>
          <Input type="password" placeholder="Минимум 6 символов" className="h-10 rounded-lg" {...register('password')} />
          {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
        </div>

        <Button type="submit" className="w-full h-10 rounded-lg mt-1.5" disabled={isSubmitting}>
          {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
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
