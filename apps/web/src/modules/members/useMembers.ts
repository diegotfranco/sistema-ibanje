import { useResourceList, useResourceMutations } from '@/lib/resourceQuery';
import type { MemberFormValues, MemberResponse } from '@/schemas/member';

const BASE = '/members';
const KEY = ['members'] as const;

export function useMembers() {
  return useResourceList<MemberResponse>(BASE, KEY);
}

export function useMemberMutations() {
  return useResourceMutations<MemberResponse, MemberFormValues, Partial<MemberFormValues>>(
    BASE,
    KEY,
    { created: 'Membro cadastrado.', updated: 'Membro atualizado.', removed: 'Membro removido.' }
  );
}
