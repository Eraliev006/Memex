import { useState, useCallback, useRef } from 'react'
import { getAccessToken } from '~/shared/api/config/axios-instance'
import { API_BASE_URL } from '~/shared/api/config/env'

interface UseSSEStreamOptions {
  onChunk?: (chunk: string) => void
  onDone?: () => void
  onError?: (error: Error) => void
}

// стабильная ссылка по умолчанию: `{}` в сигнатуре пересоздавался бы на каждый
// рендер и обесценивал бы useCallback ниже, когда вызывающий не передаёт options
const DEFAULT_OPTIONS: UseSSEStreamOptions = {}

export function useSSEStream(options: UseSSEStreamOptions = DEFAULT_OPTIONS) {
  const [status, setStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle')
  const [chunks, setChunks] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const start = useCallback(async (url: string, body: object): Promise<boolean> => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setChunks([])
    setStatus('streaming')

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error(`HTTP error ${response.status}`)
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            // не используем .trim(): токены — это сырой текст модели и могут
            // начинаться/заканчиваться пробелом, который нельзя терять при склейке
            const data = line.slice(6).replace(/\r$/, '')
            if (data === '[DONE]') continue
            if (data !== '') {
              setChunks((prev) => [...prev, data])
              options.onChunk?.(data)
            }
          }
        }
      }

      setStatus('done')
      options.onDone?.()
      return true
    } catch (error) {
      if ((error as Error).name === 'AbortError') return false
      setStatus('error')
      options.onError?.(error as Error)
      return false
    }
  }, [options])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
  }, [])

  const text = chunks.join('')

  return { status, chunks, text, start, stop }
}