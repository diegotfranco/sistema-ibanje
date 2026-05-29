import { useState } from 'react';
import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/Button';
import { YearPicker } from '@/components/YearPicker';
import { MonthPicker } from '@/components/MonthPicker';
import { getCurrentMonth } from '@/lib/datetime';
import {
  useAttenderDonationsSummary,
  useAttenderDonationsEntries
} from '@/modules/me/useDonations';
import DonationsYearView from './DonationsYearView';
import DonationsMonthView from './DonationsMonthView';

const API_URL = import.meta.env.VITE_API_URL || '/api';

type Scope = 'ano' | 'mes';

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
  const [scope, setScope] = useState<Scope>('ano');
  const [year, setYear] = useState<number | undefined>(undefined);
  const [month, setMonth] = useState<string>(getCurrentMonth());

  const summary = useAttenderDonationsSummary(attenderId, year);
  const entries = useAttenderDonationsEntries(attenderId, month, open && scope === 'mes');

  // Server resolves an undefined year to the most recent with data — reflect that in the picker.
  const displayYear = year ?? summary.data?.year;
  const availableYears = summary.data?.availableYears ?? [];

  const pdfHref =
    scope === 'mes'
      ? `${API_URL}/attenders/${attenderId}/donations/pdf?month=${month}`
      : `${API_URL}/attenders/${attenderId}/donations/pdf${displayYear ? `?year=${displayYear}` : ''}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-row items-center justify-between pr-8">
          <DialogTitle>Contribuições de {attenderName}</DialogTitle>
          {attenderId && (
            <Button variant="outline" size="sm" asChild>
              <a href={pdfHref} download target="_blank" rel="noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </a>
            </Button>
          )}
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <TabsList>
              <TabsTrigger value="ano">Ano</TabsTrigger>
              <TabsTrigger value="mes">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
          {scope === 'ano' ? (
            <YearPicker
              years={availableYears}
              value={displayYear}
              onChange={setYear}
              placeholder="Ano"
              className="w-32"
            />
          ) : (
            <MonthPicker value={month} onChange={setMonth} className="w-44" />
          )}
        </div>

        <div className="py-2 flex-1 overflow-auto min-w-0 px-1">
          {scope === 'ano' ? (
            <DonationsYearView data={summary.data} isLoading={summary.isLoading} />
          ) : (
            <DonationsMonthView data={entries.data} isLoading={entries.isLoading} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
