import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router'
import { getAuth } from '~/shared/api/generated/auth/auth'
import { Button } from '~/shared/ui/button'
import { ThemeToggle } from '~/shared/ui/theme-toggle'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '~/shared/ui/card'
import { Separator } from '~/shared/ui/separator'
import { InputGroup, InputGroupInput, InputGroupAddon } from '~/shared/ui/input-group'
import { User, Lock } from 'lucide-react'
import { useAuth } from '~/shared/lib/auth-context'
import { getGoogleOAuthUrl } from '~/shared/lib/google-oauth'


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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="absolute top-4 right-4">
        <ThemeToggle />
        </div>
        <Card className="w-full max-w-sm">
        <CardHeader>
            <CardTitle className="text-center text-2xl">Login</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Email</label>
                <InputGroup className="h-10">
                <InputGroupInput
                    type="email"
                    placeholder="Enter email"
                    {...register('username')}
                />
                <InputGroupAddon align="inline-end">
                    <User className="size-4" />
                </InputGroupAddon>
                </InputGroup>
                {errors.username && (
                <span className="text-xs text-red-500">{errors.username.message}</span>
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
                {isSubmitting ? 'Loading...' : 'Login'}
            </Button>

            <Button variant="link" asChild className="w-full">
                <Link to="/registration">Registration</Link>
            </Button>
            </form>

            <div className="flex items-center gap-3 my-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">или</span>
            <Separator className="flex-1" />
            </div>

            <Button
            type="button"
            variant="outline"
            className="w-full h-10 rounded-lg"
            onClick={() => { window.location.href = getGoogleOAuthUrl() }}
            >
            Войти через Google
            </Button>
        </CardContent>
        </Card>
    </div>
    )
}