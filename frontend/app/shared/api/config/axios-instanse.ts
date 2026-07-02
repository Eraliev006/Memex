import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // чтобы httpOnly cookie с refresh токеном уходил автоматически
})

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

// Подставляем access токен в каждый запрос
axiosInstance.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Если 401 — пробуем refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        const { data } = await axios.post(
          'http://localhost:8000/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        )
        accessToken = data.access_token
        original.headers.Authorization = `Bearer ${accessToken}`
        return axiosInstance(original)
      } catch {
        accessToken = null
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)