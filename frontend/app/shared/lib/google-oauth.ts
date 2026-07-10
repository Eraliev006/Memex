import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from '~/shared/api/config/env'

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

export function getGoogleOAuthUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`
}
