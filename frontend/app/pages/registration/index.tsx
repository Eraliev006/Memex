import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router'
import { getAuth } from '~/shared/api/generated/auth/auth'
import { setAccessToken } from '~/shared/api/config/axios-instance'
import { Button } from '~/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/shared/ui/card'
import { InputGroup, InputGroupInput, InputGroupAddon } from '~/shared/ui/input-group'
import { User, Lock, Mail } from 'lucide-react'
import { ThemeToggle } from '~/shared/ui/theme-toggle'
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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
  })

  const onSubmit = async (data: RegistrationForm) => {
    try {
      const { setAccessToken } = useAuth()
      await registerApiV1AuthRegisterPost({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      // После регистрации сразу логиним
      const loginResponse = await loginApiV1AuthLoginPost({
        username: data.email,
        password: data.password,
        grant_type: 'password',
        scope: '',
      })
      setAccessToken(loginResponse.data.access_token)
      navigate('/documents')
    } catch (e) {
      console.error('Registration failed', e)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Name</label>
              <InputGroup className="h-10">
                <InputGroupInput
                  type="text"
                  placeholder="Enter your name"
                  {...register('name')}
                />
                <InputGroupAddon align="inline-end">
                  <User className="size-4" />
                </InputGroupAddon>
              </InputGroup>
              {errors.name && (
                <span className="text-xs text-red-500">{errors.name.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Email</label>
              <InputGroup className="h-10">
                <InputGroupInput
                  type="email"
                  placeholder="Enter email"
                  {...register('email')}
                />
                <InputGroupAddon align="inline-end">
                  <Mail className="size-4" />
                </InputGroupAddon>
              </InputGroup>
              {errors.email && (
                <span className="text-xs text-red-500">{errors.email.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Password</label>
              <InputGroup className="h-10">
                <InputGroupInput
                  type="password"
                  placeholder="Enter your password"
                  {...register('password')}
                />
                <InputGroupAddon align="inline-end">
                  <Lock className="size-4" />
                </InputGroupAddon>
              </InputGroup>
              {errors.password && (
                <span className="text-xs text-red-500">{errors.password.message}</span>
              )}
            </div>

            <Button type="submit" className="w-full h-10 rounded-lg mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Loading...' : 'Register'}
            </Button>

            <Button variant="link" asChild className="w-full">
              <Link to="/login">Already have an account? Login</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}