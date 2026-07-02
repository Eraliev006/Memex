import { defineConfig } from 'orval'

export default defineConfig({
  memex: {
    input: {
      target: 'http://localhost:8000/api/v1/openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'app/shared/api/generated',
      schemas: 'app/shared/api/generated/model',
      client: 'axios',
      httpClient: 'axios',
      override: {
        mutator: {
          path: 'app/shared/api/config/axios-instance.ts',
          name: 'axiosInstance',
        },
      },
    },
  },
})