import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MeResponse } from '@sistema-ibanje/shared';

export function useCurrentUser() {
  return useQuery<MeResponse>({
    queryKey: ['currentUser'],
    queryFn: () => api.get<MeResponse>('/auth/me'),
    staleTime: Infinity
  });
}
