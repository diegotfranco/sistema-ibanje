import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAttenderDonations } from './useDonations';
import DonationsTable from './DonationsTable';

type Props = {
  attenderId: number | null;
  attenderName: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function AttenderDonationsDialog({
  attenderId,
  attenderName,
  open,
  onOpenChange
}: Props) {
  const [page, setPage] = useState(1);
  const limit = 20;

  const query = useAttenderDonations(attenderId, page, limit);
  const data = query.data?.data ?? [];
  const total = query.data?.total ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Contribuições de {attenderName}</DialogTitle>
        </DialogHeader>
        <div className="py-4 flex-1 overflow-auto min-w-0">
          <DonationsTable
            data={data}
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            loading={query.isLoading}
            emptyMessage={`Nenhuma contribuição encontrada para ${attenderName}.`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
