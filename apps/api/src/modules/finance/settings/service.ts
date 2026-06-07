import * as repo from './repository.js';
import { assertPermission } from '../../../lib/permissions.js';
import { Module, Action, ADMIN_ROLE_NAME } from '../../../lib/constants.js';
import { httpError } from '../../../lib/errors.js';
import type { FinanceSettingsResponse, UpdateFinanceSettingsRequest } from './schema.js';

async function buildResponse(): Promise<FinanceSettingsResponse> {
  const settings = await repo.getFinanceSettings();
  if (!settings) throw httpError(409, 'Finance settings not initialized');
  return {
    openingBalance: settings.openingBalance,
    lockedByClosing: await repo.hasFechadoClosing(),
    updatedAt: settings.updatedAt
  };
}

export async function getFinanceSettings(): Promise<FinanceSettingsResponse> {
  return buildResponse();
}

export async function updateOpeningBalance(
  callerId: number,
  body: UpdateFinanceSettingsRequest
): Promise<FinanceSettingsResponse> {
  await assertPermission(callerId, Module.ChurchSettings, Action.Update);

  // Freeze once the first month is closed — but let an Administrador override, since
  // a wrong opening balance entered on day one would otherwise be unfixable in-app.
  if (await repo.hasFechadoClosing()) {
    const roleName = await repo.getUserRoleName(callerId);
    if (roleName !== ADMIN_ROLE_NAME) {
      throw httpError(
        409,
        'O saldo inicial não pode ser alterado após o primeiro fechamento. Apenas um administrador pode corrigi-lo.'
      );
    }
  }

  await repo.updateOpeningBalance(body.openingBalance);
  return buildResponse();
}
