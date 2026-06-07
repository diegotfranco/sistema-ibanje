import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';

type AttenderRow = { id: number; name: string };
type MembershipLetterRow = {
  id: number;
  attenderId: number;
  type: 'pedido_de_carta_de_transferência' | 'carta_de_transferência';
  letterDate: string;
  otherChurchName: string;
  otherChurchCity: string;
  signingSecretaryName: string;
  signingSecretaryTitle: string;
  signingPresidentName: string;
  signingPresidentTitle: string;
  createdByUserId: number;
};

describe('membership letters', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;
  let firstAttenderId: number;
  let createdLetterId: number;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');

    // Get a valid attenderId from the list
    const attendersList = await app.inject({
      method: 'GET',
      url: '/attenders?limit=100',
      headers: { cookie: admin.cookie }
    });
    expect(attendersList.statusCode).toBe(200);
    const attenders = attendersList.json<{ data: AttenderRow[] }>().data;
    expect(attenders.length).toBeGreaterThan(0);
    firstAttenderId = attenders[0].id;
  });

  it('creates a membership letter (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/membership-letters',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        attenderId: firstAttenderId,
        type: 'pedido_de_carta_de_transferência',
        letterDate: '2026-06-04',
        otherChurchName: 'Igreja Evangélica',
        otherChurchCity: 'São Paulo',
        otherChurchState: 'SP'
      }
    });
    expect(res.statusCode).toBe(201);

    const letter = res.json<MembershipLetterRow>();
    expect(letter.attenderId).toBe(firstAttenderId);
    expect(letter.type).toBe('pedido_de_carta_de_transferência');
    expect(letter.otherChurchName).toBe('Igreja Evangélica');
    expect(letter.otherChurchCity).toBe('São Paulo');
    expect(letter.signingSecretaryName).toBeTruthy();
    expect(letter.signingSecretaryTitle).toBeTruthy();
    expect(letter.signingPresidentName).toBeTruthy();
    expect(letter.signingPresidentTitle).toBeTruthy();
    expect(letter.createdByUserId).toBeTruthy();

    createdLetterId = letter.id;
  });

  it('lists membership letters (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/membership-letters',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);

    const response = res.json<{ data: MembershipLetterRow[] }>();
    expect(Array.isArray(response.data)).toBe(true);
    const found = response.data.find((l) => l.id === createdLetterId);
    expect(found).toBeDefined();
    expect(found?.attenderId).toBe(firstAttenderId);
  });

  it('lists with attenderId filter', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/membership-letters?attenderId=${firstAttenderId}`,
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);

    const response = res.json<{ data: MembershipLetterRow[] }>();
    expect(response.data.every((l) => l.attenderId === firstAttenderId)).toBe(true);
  });

  it('lists with type filter', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/membership-letters?type=pedido_de_carta_de_transferência',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);

    const response = res.json<{ data: MembershipLetterRow[] }>();
    expect(response.data.every((l) => l.type === 'pedido_de_carta_de_transferência')).toBe(true);
  });

  it('retrieves a letter by id (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/membership-letters/${createdLetterId}`,
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);

    const letter = res.json<MembershipLetterRow>();
    expect(letter.id).toBe(createdLetterId);
    expect(letter.attenderId).toBe(firstAttenderId);
  });

  it('returns 404 for nonexistent letter id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/membership-letters/99999',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(404);
  });

  it('renders a letter as HTML (200)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/membership-letters/${createdLetterId}/render`,
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');

    const html = res.body;
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
    // Verify the rendered letter contains expected content
    expect(html).toContain('Igreja Evangélica');
  });

  it('render returns 404 for nonexistent letter', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/membership-letters/99999/render',
      headers: { cookie: admin.cookie }
    });
    expect(res.statusCode).toBe(404);
  });

  it('updates a letter (200)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/membership-letters/${createdLetterId}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        otherChurchName: 'Igreja Batista Renovada'
      }
    });
    expect(res.statusCode).toBe(200);

    const updated = res.json<MembershipLetterRow>();
    expect(updated.otherChurchName).toBe('Igreja Batista Renovada');
    expect(updated.attenderId).toBe(firstAttenderId);
  });

  it('returns 404 when updating nonexistent letter', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/membership-letters/99999',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        otherChurchName: 'Some Church'
      }
    });
    expect(res.statusCode).toBe(404);
  });

  it('rejects POST with missing otherChurchName (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/membership-letters',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        attenderId: firstAttenderId,
        type: 'carta_de_transferência',
        letterDate: '2026-06-04',
        // Missing otherChurchName
        otherChurchCity: 'São Paulo'
      }
    });
    // Body-schema validation returns Fastify's default { message } (no dotted fieldErrors).
    expect(res.statusCode).toBe(400);
  });

  it('rejects POST with invalid otherChurchState length (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/membership-letters',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        attenderId: firstAttenderId,
        type: 'carta_de_transferência',
        letterDate: '2026-06-04',
        otherChurchName: 'Igreja Evangélica',
        otherChurchCity: 'São Paulo',
        otherChurchState: 'SPP' // Invalid: length must be 2
      }
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects POST with nonexistent attenderId (404)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/membership-letters',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        attenderId: 99999,
        type: 'carta_de_transferência',
        letterDate: '2026-06-04',
        otherChurchName: 'Igreja Evangélica',
        otherChurchCity: 'São Paulo'
      }
    });
    expect(res.statusCode).toBe(404);
  });

  it('blocks POST without MembershipLetters:Create permission (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/membership-letters',
      headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
      payload: {
        attenderId: firstAttenderId,
        type: 'carta_de_transferência',
        letterDate: '2026-06-04',
        otherChurchName: 'Igreja Evangélica',
        otherChurchCity: 'São Paulo'
      }
    });
    expect(res.statusCode).toBe(403);
  });

  it('blocks PATCH without MembershipLetters:Update permission (403)', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/membership-letters/${createdLetterId}`,
      headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
      payload: {
        otherChurchName: 'Another Church'
      }
    });
    expect(res.statusCode).toBe(403);
  });

  it('blocks DELETE without MembershipLetters:Delete permission (403)', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/membership-letters/${createdLetterId}`,
      headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken }
    });
    expect(res.statusCode).toBe(403);
  });

  it('deletes a letter (204) and returns 404 on subsequent fetch', async () => {
    // Create a new letter to delete
    const createRes = await app.inject({
      method: 'POST',
      url: '/membership-letters',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        attenderId: firstAttenderId,
        type: 'carta_de_transferência',
        letterDate: '2026-06-05',
        otherChurchName: 'Temporary Church',
        otherChurchCity: 'Rio de Janeiro'
      }
    });
    expect(createRes.statusCode).toBe(201);
    const letterToDelete = createRes.json<{ id: number }>().id;

    // Delete it
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/membership-letters/${letterToDelete}`,
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(deleteRes.statusCode).toBe(204);

    // Verify it's gone
    const getRes = await app.inject({
      method: 'GET',
      url: `/membership-letters/${letterToDelete}`,
      headers: { cookie: admin.cookie }
    });
    expect(getRes.statusCode).toBe(404);
  });

  it('returns 404 when deleting nonexistent letter', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/membership-letters/99999',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(res.statusCode).toBe(404);
  });
});
