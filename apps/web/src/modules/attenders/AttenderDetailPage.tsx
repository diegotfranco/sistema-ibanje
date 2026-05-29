import { useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Gift } from 'lucide-react';
import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDate, formatMonthYear } from '@/lib/datetime';
import { useAttender } from './useAttenders';
import AttenderDonationsDialog from './AttenderDonationsDialog';

function Field({
  label,
  value,
  className
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs font-medium text-muted-foreground ">{label}</Label>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-soft">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

export default function AttenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const attenderId = id ? parseInt(id, 10) : null;

  const { data: attender, isLoading } = useAttender(attenderId);

  const [donationsOpen, setDonationsOpen] = useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </PageContainer>
    );
  }

  if (!attender) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Congregado não encontrado.</p>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 -ml-2 text-muted-foreground"
            onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <Card>
            <CardHeaderRow>
              <div className="min-w-0 space-y-1.5">
                <CardTitle className="text-foreground">{attender.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={attender.status} />
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      attender.isMember
                        ? 'bg-primary/10 text-primary-soft'
                        : 'bg-muted text-muted-foreground'
                    )}>
                    {attender.isMember ? 'Membro' : 'Congregado'}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setDonationsOpen(true)}>
                <Gift className="h-4 w-4 mr-2" />
                Contribuições
              </Button>
            </CardHeaderRow>

            <Separator />

            <CardContent className="space-y-6 pt-6">
              <Section title="Vínculo">
                <Field label="Membro" value={attender.isMember ? 'Sim' : 'Não'} />
                {attender.isMember && (
                  <Field
                    label="Membro desde"
                    value={attender.memberSince ? formatMonthYear(attender.memberSince) : null}
                  />
                )}
                {attender.isMember && attender.admissionMode && (
                  <Field label="Modo de admissão" value={attender.admissionMode} />
                )}
                {attender.congregatingSince && (
                  <Field
                    label="Congregando desde"
                    value={formatMonthYear(attender.congregatingSince)}
                  />
                )}
                <Field
                  label="Batismo"
                  value={attender.baptismDate ? formatDate(attender.baptismDate) : null}
                />
              </Section>

              <Section title="Contato">
                <Field label="E-mail" value={attender.email} />
                <Field label="Telefone" value={attender.phone} />
                <Field
                  label="Data de nascimento"
                  value={attender.birthDate ? formatDate(attender.birthDate) : null}
                />
              </Section>

              <Section title="Endereço">
                <Field label="Rua" value={attender.addressStreet} className="sm:col-span-2" />
                <Field label="Número" value={attender.addressNumber} />
                <Field label="Complemento" value={attender.addressComplement} />
                <Field label="Bairro" value={attender.addressDistrict} />
                <Field label="CEP" value={attender.postalCode} />
                <Field label="Cidade" value={attender.city} />
                <Field label="Estado" value={attender.state} />
              </Section>
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <AttenderDonationsDialog
        attenderId={attender.id}
        attenderName={attender.name}
        open={donationsOpen}
        onOpenChange={setDonationsOpen}
      />
    </>
  );
}
