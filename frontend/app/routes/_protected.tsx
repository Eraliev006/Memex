import { Outlet } from 'react-router'
import { AuthGuard } from '~/shared/lib/auth-guard'
import { AppLayout } from '~/shared/ui/layout'

export default function ProtectedLayout() {
  return (
    <AuthGuard>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthGuard>
  )
}
