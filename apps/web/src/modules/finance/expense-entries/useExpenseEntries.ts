import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useResourceList, useResourceMutations } from '@/lib/resourceQuery';
import { api, ApiError } from '@/lib/api';
import type {
  ExpenseEntryResponse,
  ExpenseEntryCreateBody,
  ExpenseEntryUpdateBody
} from '@/schemas/expense-entry';

const BASE = '/expense-entries';
const KEY = ['expense-entries'] as const;

function describeError(err: unknown, fallback: string) {
  if (err instanceof ApiError) return err.message || fallback;
  return fallback;
}

export function useExpenseEntries() {
  return useResourceList<ExpenseEntryResponse>(BASE, KEY);
}

export function useExpenseEntryMutations() {
  return useResourceMutations<ExpenseEntryResponse, ExpenseEntryCreateBody, ExpenseEntryUpdateBody>(
    BASE,
    KEY,
    {
      created: 'Lançamento criado.',
      updated: 'Lançamento atualizado.',
      removed: 'Lançamento removido.'
    }
  );
}

export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      return api.postForm<ExpenseEntryResponse>(`${BASE}/${id}/receipt`, form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Comprovante enviado.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao enviar comprovante.'))
  });
}

export function useDeleteReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`${BASE}/${id}/receipt`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success('Comprovante removido.');
    },
    onError: (err) => toast.error(describeError(err, 'Erro ao remover comprovante.'))
  });
}
