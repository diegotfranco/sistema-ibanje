import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb, clearMonthlyClosings } from './helpers/db.js';

type ChurchSettingsRow = {
  id: number;
  name: string;
  cnpj: string;
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  postalCode: string;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  logoPath: string | null;
  currentPresidentName: string | null;
  currentPresidentTitle: string | null;
  currentSecretaryName: string | null;
  currentSecretaryTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
};

describe('church-settings module', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    await clearMonthlyClosings();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');
  });

  it('reads church settings (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/church-settings',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    const settings = res.json<ChurchSettingsRow>();
    expect(settings.id).toBeDefined();
    expect(settings.name).toBeDefined();
  });

  it('updates church settings with appropriate permissions (200) and persists', async () => {
    const newName = 'Updated Church Name';
    const res = await app.inject({
      method: 'PUT',
      url: '/church-settings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        name: newName,
        phone: '11999999999'
      }
    });
    expect(res.statusCode).toBe(200);
    const updated = res.json<ChurchSettingsRow>();
    expect(updated.name).toBe(newName);
    expect(updated.phone).toBe('11999999999');

    // Confirm the change persisted on a fresh read.
    const reread = await app.inject({
      method: 'GET',
      url: '/church-settings',
      headers: { cookie: admin.cookie }
    });
    expect(reread.json<ChurchSettingsRow>().name).toBe(newName);
  });

  it('rejects invalid postal code format (400)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/church-settings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        postalCode: 'invalid'
      }
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid email format (400)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/church-settings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        email: 'not-an-email'
      }
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid addressState length (400)', async () => {
    // addressState must be exactly 2 chars; 3 chars fails validation.
    const failRes = await app.inject({
      method: 'PUT',
      url: '/church-settings',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        addressState: 'SPX'
      }
    });
    expect(failRes.statusCode).toBe(400);
  });

  describe('route gating', () => {
    it('allows reading settings for any authenticated user (200)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/church-settings',
        headers: { cookie: congregant.cookie }
      });
      expect(res.statusCode).toBe(200);
    });

    it('blocks a congregant from updating settings (403)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/church-settings',
        headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
        payload: {
          name: 'Hacked Church'
        }
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks unauthenticated access (401)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/church-settings'
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
