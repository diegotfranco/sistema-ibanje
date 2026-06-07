import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { eq } from 'drizzle-orm';

// Capture the argument passed to resend.emails.send. email.ts constructs `new Resend(...)`
// at module load, so the mock must exist before that import runs. ESM hoists the static
// imports above any plain `const`, so the mock fn is defined via vi.hoisted to guarantee
// it is initialized first.
const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn().mockResolvedValue({ data: { id: 'test' }, error: null })
}));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  }
}));

import { db } from '../src/db/index.js';
import { churchSettings } from '../src/db/schema.js';
import { env } from '../src/config/env.js';
import { sendInviteEmail, sendPasswordResetEmail } from '../src/lib/email.js';

const ADDRESS = env.EMAIL_FROM_ADDRESS;

async function setChurchName(name: string) {
  await db.update(churchSettings).set({ name }).where(eq(churchSettings.id, 1));
}

describe('email sender from-string', () => {
  let originalName: string;

  beforeAll(async () => {
    const [row] = await db
      .select({ name: churchSettings.name })
      .from(churchSettings)
      .where(eq(churchSettings.id, 1))
      .limit(1);
    originalName = row?.name ?? '';
  });

  afterAll(async () => {
    await setChurchName(originalName);
  });

  beforeEach(() => {
    sendMock.mockClear();
  });

  it('composes from = "<church name>" <verified address> for invite emails', async () => {
    await setChurchName('Igreja Teste');
    await sendInviteEmail('user@example.com', 'token123');

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].from).toBe(`"Igreja Teste" <${ADDRESS}>`);
  });

  it('uses the same configured sender for password-reset emails', async () => {
    await setChurchName('Igreja Teste');
    await sendPasswordResetEmail('user@example.com', 'token123');

    expect(sendMock.mock.calls[0][0].from).toBe(`"Igreja Teste" <${ADDRESS}>`);
  });

  it('falls back to "Sistema Ibanje" when the church name is blank', async () => {
    await setChurchName('');
    await sendInviteEmail('user@example.com', 'token123');

    expect(sendMock.mock.calls[0][0].from).toBe(`"Sistema Ibanje" <${ADDRESS}>`);
  });
});
