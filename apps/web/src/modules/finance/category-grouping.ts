export type CategoryLike = { id: number; name: string; parentId: number | null };

export type CategoryGroup<T extends CategoryLike> = {
  parent: T;
  children: T[];
};

export type GroupedCategories<T extends CategoryLike> = {
  groups: CategoryGroup<T>[];
  orphans: T[];
};

export function groupCategoriesByParent<T extends CategoryLike>(rows: T[]): GroupedCategories<T> {
  const parentById = new Map<number, T>();
  const childrenByParentId = new Map<number, T[]>();
  const orphans: T[] = [];

  for (const row of rows) {
    if (row.parentId === null) {
      parentById.set(row.id, row);
    }
  }

  for (const row of rows) {
    if (row.parentId === null) continue;
    if (!parentById.has(row.parentId)) {
      orphans.push(row);
      continue;
    }
    const bucket = childrenByParentId.get(row.parentId) ?? [];
    bucket.push(row);
    childrenByParentId.set(row.parentId, bucket);
  }

  const groups: CategoryGroup<T>[] = Array.from(parentById.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((parent) => ({
      parent,
      children: (childrenByParentId.get(parent.id) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR')
      )
    }));

  orphans.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return { groups, orphans };
}
