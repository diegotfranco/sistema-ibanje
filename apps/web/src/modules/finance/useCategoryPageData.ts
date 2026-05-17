import { useMemo } from 'react';
import { ActiveStatus } from '@sistema-ibanje/shared';

type CategoryBase = { id: number; name: string; status: string; parentId: number | null };

export function useCategoryPageData<T extends CategoryBase>(data: T[] | undefined) {
  const allCategories = useMemo(() => data ?? [], [data]);
  const items = useMemo(
    () => allCategories.filter((r) => r.status === ActiveStatus.Active),
    [allCategories]
  );
  const getCategoryName = useMemo(
    () => (id: number | null) => {
      if (!id) return '—';
      return allCategories.find((c) => c.id === id)?.name ?? '—';
    },
    [allCategories]
  );
  return { allCategories, items, getCategoryName };
}
