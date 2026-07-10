import axios from 'axios'
import { API_BASE_URL } from './env'

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

axiosInstance.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Дедупликация: параллельные 401 не должны запускать несколько /auth/refresh —
// если refresh-токен на бэкенде одноразовый (ротация), второй запрос его "сожжёт".
let refreshPromise: Promise<string> | null = null

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/api/v1/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        accessToken = data.access_token
        return data.access_token as string
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        const token = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${token}`
        return axiosInstance(original)
      } catch {
        accessToken = null
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)