import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAttenders } from '@/modules/attenders/useAttenders';
import { useMeetingAttendersPresent, useSetMeetingAttendersPresent } from './useMinutes';
import EditAttendersDialog from './EditAttendersDialog';

interface Props {
  meetingId: number;
  canEdit: boolean;
}

export default function AttendersPresentsCard({ meetingId, canEdit }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const { data: attendersList } = useAttenders();
  const { data: presentData } = useMeetingAttendersPresent(meetingId);
  const setPresent = useSetMeetingAttendersPresent(meetingId);

  const presentIds = new Set(presentData?.data?.map((a) => a.id) ?? []);
  const presentNames = presentData?.data?.map((a) => a.name) ?? [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Congregados Presentes</CardTitle>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              Editar Congregados Presentes
            </Button>
          )}
        </CardHeader>
        <CardContent className="text-sm">
          {presentNames.length === 0 ? (
            <p className="text-muted-foreground">Nenhum congregado presente registrado.</p>
          ) : (
            <ul className="space-y-1">
              {presentNames.map((name) => (
                <li key={name} className="flex items-center">
                  {name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <EditAttendersDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        selectedIds={Array.from(presentIds)}
        availableAttenders={(attendersList?.data ?? []).filter(
          (a) => a.isMember && a.status === 'ativo'
        )}
        onSubmit={(ids) => setPresent.mutate(ids, { onSuccess: () => setEditOpen(false) })}
        isPending={setPresent.isPending}
      />
    </>
  );
}
