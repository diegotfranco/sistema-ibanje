import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';

type FeedItem = {
  id: number | null;
  eventId?: number;
  attenderId?: number;
  title: string;
  date: string;
  type: 'lembrete' | 'aniversario' | 'batismo' | 'evento';
};

// A far-future window keeps the assertions independent of seed data drift.
const FROM = '2099-03-01';
const TO = '2099-03-31';

describe('calendar smoke: CRUD, merged feed, and access split', () => {
  let app: FastifyInstance;
  let secretary: AuthCookies;
  let admin: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    secretary = await loginAs(app, 'secretario@email.com', 'secretario123');
    admin = await loginAs(app, 'admin@email.com', 'admin123');
  });

  it('soft-deletes a manual entry through the CRUD lifecycle', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/calendar',
      headers: { cookie: secretary.cookie, 'x-csrf-token': secretary.csrfToken },
      payload: { title: 'Reunião de Obreiros', date: '2099-03-10', notes: 'Sala 2' }
    });
    expect(created.statusCode).toBe(201);
    const entry = created.json<{ id: number }>();

    const listed = await app.inject({
      method: 'GET',
      url: '/calendar',
      headers: { cookie: secretary.cookie }
    });
    expect(listed.statusCode).toBe(200);
    expect(listed.json<{ data: { id: number }[] }>().data.some((e) => e.id === entry.id)).toBe(
      true
    );

    const patched = await app.inject({
      method: 'PATCH',
      url: `/calendar/${entry.id}`,
      headers: { cookie: secretary.cookie, 'x-csrf-token': secretary.csrfToken },
      payload: { title: 'Reunião de Obreiros (remarcada)' }
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json<{ title: string }>().title).toBe('Reunião de Obreiros (remarcada)');

    const removed = await app.inject({
      method: 'DELETE',
      url: `/calendar/${entry.id}`,
      headers: { cookie: secretary.cookie, 'x-csrf-token': secretary.csrfToken }
    });
    expect(removed.statusCode).toBe(204);

    const afterDelete = await app.inject({
      method: 'GET',
      url: '/calendar',
      headers: { cookie: secretary.cookie }
    });
    expect(afterDelete.json<{ data: { id: number }[] }>().data.some((e) => e.id === entry.id)).toBe(
      false
    );
  });

  it('merges manual entries, derived birthdays, and events (with timezone bucketing)', async () => {
    // Manual reminder inside the window.
    const entry = await app.inject({
      method: 'POST',
      url: '/calendar',
      headers: { cookie: secretary.cookie, 'x-csrf-token': secretary.csrfToken },
      payload: { title: 'Feriado de teste', date: '2099-03-12' }
    });
    expect(entry.statusCode).toBe(201);

    // Attender whose birthday recurs inside the window.
    const attender = await app.inject({
      method: 'POST',
      url: '/attenders',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: { name: 'Aniversariante de Março', birthDate: '1990-03-15' }
    });
    expect(attender.statusCode).toBe(201);
    const attenderId = attender.json<{ id: number }>().id;

    // Event at 02:00Z → 23:00 the previous day in America/Sao_Paulo (UTC-3): the feed must bucket it
    // onto the local day 2099-03-24, NOT the UTC day 2099-03-25.
    const event = await app.inject({
      method: 'POST',
      url: '/events',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
      payload: {
        title: 'Vigília de teste',
        startTime: '2099-03-25T02:00:00.000Z',
        endTime: '2099-03-25T05:00:00.000Z'
      }
    });
    expect(event.statusCode).toBe(201);
    const eventId = event.json<{ id: number }>().id;

    const res = await app.inject({
      method: 'GET',
      url: `/calendar/feed?from=${FROM}&to=${TO}`,
      headers: { cookie: secretary.cookie }
    });
    expect(res.statusCode).toBe(200);
    const feed = res.json<FeedItem[]>();

    expect(feed.some((i) => i.type === 'lembrete' && i.date === '2099-03-12')).toBe(true);

    const birthday = feed.find((i) => i.type === 'aniversario' && i.attenderId === attenderId);
    expect(birthday?.date).toBe('2099-03-15');

    const eventItem = feed.find((i) => i.type === 'evento' && i.eventId === eventId);
    expect(eventItem?.date).toBe('2099-03-24');

    // Ascending by date.
    const dates = feed.map((i) => i.date);
    expect(dates).toEqual([...dates].sort((a, b) => a.localeCompare(b)));
  });

  it('exposes the feed to any authenticated role but gates management', async () => {
    const congregant = await loginAs(app, 'congregado@email.com', 'congregado123');

    const feed = await app.inject({
      method: 'GET',
      url: `/calendar/feed?from=${FROM}&to=${TO}`,
      headers: { cookie: congregant.cookie }
    });
    expect(feed.statusCode).toBe(200);

    const list = await app.inject({
      method: 'GET',
      url: '/calendar',
      headers: { cookie: congregant.cookie }
    });
    expect(list.statusCode).toBe(403);

    const create = await app.inject({
      method: 'POST',
      url: '/calendar',
      headers: { cookie: congregant.cookie, 'x-csrf-token': congregant.csrfToken },
      payload: { title: 'Não permitido', date: '2099-03-20' }
    });
    expect(create.statusCode).toBe(403);
  });
});
