import { describe, it, expect, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';

// MinIO isn't part of the test stack (initStorage is skipped under NODE_ENV=test),
// so the object store is faked in-memory. This still exercises the real validation,
// allowlist, sniffing, and logoPath persistence — only the bytes never leave the process.
const { store } = vi.hoisted(() => ({ store: new Map<string, Buffer>() }));

vi.mock('../src/lib/storage.js', () => ({
  uploadFile: vi.fn(async (key: string, body: Buffer) => {
    store.set(key, body);
  }),
  deleteFile: vi.fn(async (key: string) => {
    store.delete(key);
  }),
  getFileStream: vi.fn(async (key: string) => {
    const body = store.get(key);
    return body ? { body, contentType: 'image/png', contentLength: body.length } : null;
  }),
  getFileBuffer: vi.fn(async (key: string) => store.get(key) ?? null),
  ALLOWED_MIME_TYPES: { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' },
  initStorage: vi.fn()
}));

// A real 1×1 PNG so the `file-type` content sniff (not mocked) recognises it.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

function multipart(field: string, filename: string, contentType: string, content: Buffer) {
  const boundary = `----vitest${Math.random().toString(16).slice(2)}`;
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return {
    body: Buffer.concat([head, content, tail]),
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

describe('church-settings logo', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  let congregant: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregant = await loginAs(app, 'congregado@email.com', 'congregado123');
  });

  function uploadLogo(auth: AuthCookies, contentType: string, content: Buffer) {
    const { body, contentType: ct } = multipart('file', 'logo.png', contentType, content);
    return app.inject({
      method: 'POST',
      url: '/church-settings/logo',
      headers: { cookie: auth.cookie, 'x-csrf-token': auth.csrfToken, 'content-type': ct },
      payload: body
    });
  }

  it('uploads a PNG, sets logoPath, and serves the bytes back', async () => {
    const res = await uploadLogo(admin, 'image/png', PNG_1x1);
    expect(res.statusCode).toBe(200);
    const logoPath = res.json<{ logoPath: string | null }>().logoPath;
    expect(logoPath).toMatch(/^logos\/.+\.png$/);

    const get = await app.inject({
      method: 'GET',
      url: '/church-settings/logo',
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(200);
    expect(get.headers['content-type']).toContain('image/png');
    expect(get.rawPayload.length).toBe(PNG_1x1.length);
  });

  it('rejects a non-image content type (400)', async () => {
    const res = await uploadLogo(admin, 'application/pdf', Buffer.from('%PDF-1.4'));
    expect(res.statusCode).toBe(400);
  });

  it('rejects bytes that do not match the declared image type (400)', async () => {
    const res = await uploadLogo(admin, 'image/png', Buffer.from('this is not a png'));
    expect(res.statusCode).toBe(400);
  });

  it('blocks a user without permission (403)', async () => {
    const res = await uploadLogo(congregant, 'image/png', PNG_1x1);
    expect(res.statusCode).toBe(403);
  });

  it('removes the logo (204) and then 404s on fetch', async () => {
    await uploadLogo(admin, 'image/png', PNG_1x1);

    const del = await app.inject({
      method: 'DELETE',
      url: '/church-settings/logo',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
    });
    expect(del.statusCode).toBe(204);

    const settings = await app.inject({
      method: 'GET',
      url: '/church-settings',
      headers: { cookie: admin.cookie }
    });
    expect(settings.json<{ logoPath: string | null }>().logoPath).toBeNull();

    const get = await app.inject({
      method: 'GET',
      url: '/church-settings/logo',
      headers: { cookie: admin.cookie }
    });
    expect(get.statusCode).toBe(404);
  });
});
