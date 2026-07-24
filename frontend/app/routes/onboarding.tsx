import { AuthGuard } from '~/shared/lib/auth-guard'
import { OnboardingPage } from '~/pages/onboarding'

export default function OnboardingRoute() {
  return (
    <AuthGuard>
      <OnboardingPage />
    </AuthGuard>
  )
}
