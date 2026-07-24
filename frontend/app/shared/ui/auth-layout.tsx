import { Brain } from 'lucide-react'
import type { ReactNode } from 'react'
import { ThemeToggle } from '~/shared/ui/theme-toggle'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[360px] flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-[7px]">
            <Brain className="size-4" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {children}
        {footer}
      </div>
    </div>
  )
}
