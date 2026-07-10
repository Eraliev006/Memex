import { createContext, useContext, useState, type ReactNode } from 'react'
import { setAccessToken as setAxiosToken } from '~/shared/api/config/axios-instance'

interface AuthContextType {
  accessToken: string | null
  setAccessToken: (token: string | null) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null)

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token)
    setAxiosToken(token) // синхронизируем с axios
  }

  return (
    <AuthContext.Provider value={{
      accessToken,
      setAccessToken,
      isAuthenticated: !!accessToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}