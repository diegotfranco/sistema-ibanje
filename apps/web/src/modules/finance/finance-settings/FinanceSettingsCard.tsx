import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import MoneyInput from '@/modules/finance/components/MoneyInput';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { useFinanceSettings, useUpdateOpeningBalance } from './useFinanceSettings';

const ADMIN_ROLE = 'Administrador';

export function FinanceSettingsCard() {
  const { data } = useFinanceSettings();
  const { data: currentUser } = useCurrentUser();
  const updateMutation = useUpdateOpeningBalance();

  const [value, setValue] = React.useState('');
  // Seed the local input from the server value once it loads / changes, without an
  // effect (setState-during-render with a guard, per project convention).
  const [synced, setSynced] = React.useState<string | null>(null);
  if (data && synced !== data.openingBalance) {
    setSynced(data.openingBalance);
    setValue(data.openingBalance);
  }

  const isAdmin = currentUser?.role === ADMIN_ROLE;
  const locked = data?.lockedByClosing ?? false;
  const readOnly = locked && !isAdmin;
  const dirty = data ? Number(value) !== Number(data.openingBalance) : false;

  // One derived message for the locked state instead of a nested ternary in the JSX.
  const lockMessage = !locked
    ? null
    : readOnly
      ? 'O saldo inicial está bloqueado porque já existe um fechamento concluído. Apenas um administrador pode alterá-lo.'
      : 'Já existe um fechamento concluído — alterar o saldo inicial afeta registros já fechados. Edite apenas para corrigir um erro.';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="py-0.75">Saldo inicial</CardTitle>
      </CardHeader>
      <CardContent className="mt-4 space-y-4">
        <Field className="max-w-xs">
          <FieldLabel htmlFor="openingBalance">Saldo inicial (R$)</FieldLabel>
          <MoneyInput id="openingBalance" value={value} onChange={setValue} disabled={readOnly} />
        </Field>

        <FieldDescription>
          Base do primeiro fechamento mensal — informe o saldo em caixa/banco no início do uso do
          sistema.
        </FieldDescription>

        {lockMessage && (
          <Alert className="border-warning/40 text-warning">
            <AlertTriangle />
            <AlertDescription className="text-warning/90">{lockMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={() => updateMutation.mutate(value)}
            disabled={readOnly || !dirty || updateMutation.isPending}
            className="w-full sm:w-auto sm:min-w-32">
            {updateMutation.isPending ? 'Salvando...' : 'Salvar saldo inicial'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
