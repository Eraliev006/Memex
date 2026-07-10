import { useQuery } from '@tanstack/react-query'
import { getAuth } from '~/shared/api/generated/auth/auth'

const { getMeApiV1AuthMeGet } = getAuth()

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => getMeApiV1AuthMeGet(),
    select: (res) => res.data,
  })
}