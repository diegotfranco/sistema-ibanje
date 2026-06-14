import { useResourceList } from '@/hooks/useResourceQuery';
import type { AuditEntry } from './schema';

export type AuditFilters = {
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
};

export function useAudit(page: number, limit: number, filters: AuditFilters) {
  return useResourceList<AuditEntry>('/audit', ['audit'], { page, limit, ...filters });
}
