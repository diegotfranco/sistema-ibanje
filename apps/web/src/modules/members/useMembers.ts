import { useResourceList } from '@/lib/resourceQuery';
import type { MemberResponse } from '@/schemas/member';

const BASE = '/members';
const KEY = ['members'] as const;

export function useMembers() {
  return useResourceList<MemberResponse>(BASE, KEY);
}
