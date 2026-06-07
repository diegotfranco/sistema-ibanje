import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from '../helpers/app.js';
import { loginAs, type AuthCookies } from '../helpers/auth.js';
import { reseedDb, clearMonthlyClosings } from '../helpers/db.js';

// Business-invariant guards around monthly closings: no duplicate period, valid month range,
// no deleting a closing that has left the `aberto` state, and 404 on transitions of unknown ids.
describe('monthly closing guards', () => {
  let app: FastifyInstance;
  let auth: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    await clearMonthlyClosings();
    app = await getTestApp();
    auth = await loginAs(app, 'admin@email.com', 'admin123');
  });

  function create(periodYear: number, periodMonth: number) {
    return app.inject({
      method: 'POST',
      url: '/monthly-closings',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: { periodYear, periodMonth }
    });
  }

  function action(id: number, name: string) {
    return app.inject({
      method: 'POST',
      url: `/monthly-closings/${id}/${name}`,
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken },
      payload: {}
    });
  }

  it('rejects a duplicate closing for the same period with 409', async () => {
    const first = await create(2096, 1);
    expect(first.statusCode).toBe(201);

    const dup = await create(2096, 1);
    expect(dup.statusCode).toBe(409);
  });

  it.each([
    { label: 'month 13', periodMonth: 13 },
    { label: 'month 0', periodMonth: 0 }
  ])('rejects an invalid $label with 400', async ({ periodMonth }) => {
    const res = await create(2096, periodMonth);
    expect(res.statusCode).toBe(400);
  });

  it('refuses to delete a closing that is no longer aberto (409)', async () => {
    const created = await create(2096, 2);
    const { id } = created.json<{ id: number }>();

    const submit = await action(id, 'submit'); // aberto → em revisão
    expect(submit.statusCode).toBe(200);

    const del = await app.inject({
      method: 'DELETE',
      url: `/monthly-closings/${id}`,
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken }
    });
    expect(del.statusCode).toBe(409);
  });

  it('returns 404 when transitioning an unknown closing', async () => {
    const res = await action(999999, 'submit');
    expect(res.statusCode).toBe(404);
  });
});
