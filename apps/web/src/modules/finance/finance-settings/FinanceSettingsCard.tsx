import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo inicial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-w-xs">
          <Label htmlFor="openingBalance">Saldo inicial (R$)</Label>
          <MoneyInput id="openingBalance" value={value} onChange={setValue} disabled={readOnly} />
        </div>

        <p className="text-sm text-muted-foreground">
          Base do primeiro fechamento mensal — informe o saldo em caixa/banco no início do uso do
          sistema.
        </p>

        {locked ? (
          readOnly ? (
            <p className="text-sm text-amber-600">
              O saldo inicial está bloqueado porque já existe um fechamento concluído. Apenas um
              administrador pode alterá-lo.
            </p>
          ) : (
            <p className="text-sm text-amber-600">
              Já existe um fechamento concluído — alterar o saldo inicial afeta registros já
              fechados. Edite apenas para corrigir um erro.
            </p>
          )
        ) : null}

        <Button
          type="button"
          onClick={() => updateMutation.mutate(value)}
          disabled={readOnly || !dirty || updateMutation.isPending}>
          {updateMutation.isPending ? 'Salvando...' : 'Salvar saldo inicial'}
        </Button>
      </CardContent>
    </Card>
  );
}
