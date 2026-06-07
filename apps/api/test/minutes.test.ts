import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { getTestApp } from './helpers/app.js';
import { loginAs, type AuthCookies } from './helpers/auth.js';
import { reseedDb } from './helpers/db.js';
import type { MinuteResponse, MinuteTemplateResponse } from '../src/modules/minutes/schema.js';

describe('minutes module', () => {
  let app: FastifyInstance;
  let admin: AuthCookies;
  // Congregado has a seeded permission OVERRIDE granting Editar (Update) on Atas — so it is NOT a
  // valid "no Update permission" subject. Tesoureiro has read-only Atas (Acessar + Relatórios), so
  // it's the right negative subject for Update/Create/Delete on minutes.
  let congregado: AuthCookies;
  let tesoureiro: AuthCookies;

  beforeAll(async () => {
    reseedDb();
    app = await getTestApp();
    admin = await loginAs(app, 'admin@email.com', 'admin123');
    congregado = await loginAs(app, 'congregado@email.com', 'congregado123');
    tesoureiro = await loginAs(app, 'tesoureiro@email.com', 'tesoureiro123');
  });

  // A valid TipTap/ProseMirror doc — text lives in nested `content: [{ type: 'text', text }]` nodes;
  // sanitizeMinuteDoc rejects anything with no extractable text (httpError 400 'Conteúdo inválido').
  const tiptapDoc = (text: string) => ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }]
  });

  describe('GET /minutes/suggested-number', () => {
    it('returns a suggested minute number', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/minutes/suggested-number',
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ value: string }>()).toHaveProperty('value');
      expect(typeof res.json<{ value: string }>().value).toBe('string');
    });

    it('blocks access without Minutes:Create permission', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/minutes/suggested-number',
        headers: { cookie: congregado.cookie }
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('minute lifecycle (create → draft → approve → sign)', () => {
    let meetingId: number;
    let minuteId: number;
    let minuteNumber: string;

    it('creates a meeting first', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/meetings',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingDate: '2026-06-15',
          type: 'ordinária',
          isPublic: false
        }
      });
      expect(res.statusCode).toBe(201);
      meetingId = res.json<{ id: number }>().id;
      expect(meetingId).toBeGreaterThan(0);
    });

    it('creates a minute in draft status', async () => {
      // Get a suggested number first
      const suggestedRes = await app.inject({
        method: 'GET',
        url: '/minutes/suggested-number',
        headers: { cookie: admin.cookie }
      });
      minuteNumber = suggestedRes.json<{ value: string }>().value || '1';

      const res = await app.inject({
        method: 'POST',
        url: '/minutes',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingId,
          minuteNumber,
          presidingPastorName: 'Pastor João',
          secretaryName: 'Secretário Pedro',
          openingTime: '19:30',
          closingTime: '21:00'
        }
      });
      expect(res.statusCode).toBe(201);
      const body = res.json<MinuteResponse>();
      minuteId = body.id;
      expect(body.meetingId).toBe(meetingId);
      expect(body.minuteNumber).toBe(minuteNumber);
      expect(body.presidingPastorName).toBe('Pastor João');
      expect(body.secretaryName).toBe('Secretário Pedro');
      // The DB `time` column normalizes 'HH:MM' input to 'HH:MM:SS' on the way back out.
      expect(body.openingTime).toBe('19:30:00');
      expect(body.closingTime).toBe('21:00:00');
      expect(body.currentVersion).not.toBeNull();
      expect(body.currentVersion!.status).toBe('rascunho');
      expect(body.currentVersion!.version).toBe(1);
    });

    it('updates pending version content via PATCH /:id/pending', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/minutes/${minuteId}/pending`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: { content: tiptapDoc('Conteúdo da ata de teste') }
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<MinuteResponse>();
      expect(body.currentVersion!.status).toBe('rascunho');
      // The service sanitizes the doc; assert the saved text survived the round-trip.
      expect(JSON.stringify(body.currentVersion!.content)).toContain('Conteúdo da ata de teste');
    });

    it('updates minute metadata via PATCH /:id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/minutes/${minuteId}`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          openingTime: '19:15',
          presidingPastorName: 'Pastor Mario'
        }
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<MinuteResponse>();
      expect(body.openingTime).toBe('19:15:00');
      expect(body.presidingPastorName).toBe('Pastor Mario');
    });

    it('transitions from draft to awaiting approval via POST /:id/finalize-draft', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/minutes/${minuteId}/finalize-draft`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {}
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<MinuteResponse>();
      expect(body.currentVersion!.status).toBe('aguardando aprovação');
      expect(body.currentVersion!.version).toBe(1);
    });

    it('blocks finalizing a non-draft version', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/minutes/${minuteId}/finalize-draft`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {}
      });
      expect(res.statusCode).toBe(409);
      expect(res.json<{ message: string }>().message).toContain('not a draft');
    });

    it('approves the minute via POST /:id/approve', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/minutes/${minuteId}/approve`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: { approvedAtMeetingId: meetingId }
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<MinuteResponse>();
      expect(body.currentVersion!.status).toBe('aprovada');
      expect(body.currentVersion!.approvedAtMeetingId).toBe(meetingId);
      expect(body.currentVersion!.version).toBe(1);
    });

    it('blocks approving when not in awaiting approval status', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/minutes/${minuteId}/approve`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {}
      });
      expect(res.statusCode).toBe(409);
      expect(res.json<{ message: string }>().message).toContain('pending version');
    });

    it('creates a new version when editing approved minute via POST /:id/edit-approved', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/minutes/${minuteId}/edit-approved`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          content: tiptapDoc('Ata editada após aprovação'),
          reasonForChange: 'Correção necessária'
        }
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<MinuteResponse>();
      // The previous version should be marked as 'substituída'
      expect(body.versions.length).toBe(2);
      expect(body.versions[0]!.status).toBe('substituída');
      expect(body.versions[1]!.status).toBe('aguardando aprovação');
      expect(body.versions[1]!.version).toBe(2);
      expect(body.versions[1]!.reasonForChange).toBe('Correção necessária');
      expect(body.currentVersion!.version).toBe(2);
    });

    it('approves the second version', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/minutes/${minuteId}/approve`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {}
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<MinuteResponse>();
      expect(body.versions[1]!.status).toBe('aprovada');
    });
  });

  describe('GET /minutes and GET /minutes/:id', () => {
    let testMinuteId: number;

    it('lists minutes with pagination', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/minutes?page=1&limit=20',
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{
        data: MinuteResponse[];
        total: number;
        page: number;
        limit: number;
      }>();
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('page');
      expect(body).toHaveProperty('limit');
      expect(Array.isArray(body.data)).toBe(true);
      if (body.data.length > 0) {
        testMinuteId = body.data[0]!.id;
      }
    });

    it('retrieves a specific minute by id', async () => {
      if (!testMinuteId) {
        // Create one for testing if none exist in the list
        const meetingRes = await app.inject({
          method: 'POST',
          url: '/meetings',
          headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
          payload: {
            meetingDate: '2026-06-20',
            type: 'ordinária',
            isPublic: false
          }
        });
        const meetingId = meetingRes.json<{ id: number }>().id;

        const createRes = await app.inject({
          method: 'POST',
          url: '/minutes',
          headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
          payload: {
            meetingId,
            minuteNumber: 'TEST-001'
          }
        });
        testMinuteId = createRes.json<MinuteResponse>().id;
      }

      const res = await app.inject({
        method: 'GET',
        url: `/minutes/${testMinuteId}`,
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<MinuteResponse>();
      expect(body.id).toBe(testMinuteId);
      expect(body).toHaveProperty('meetingId');
      expect(body).toHaveProperty('currentVersion');
      expect(body).toHaveProperty('versions');
    });

    it('returns 404 for non-existent minute id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/minutes/99999',
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(404);
    });

    it('allows a read-only user (Acessar on Atas) to list minutes', async () => {
      // Congregado has Acessar on Atas → can view the minutes list.
      const res = await app.inject({
        method: 'GET',
        url: '/minutes?page=1&limit=20',
        headers: { cookie: congregado.cookie }
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('validation and error handling', () => {
    it('rejects POST /minutes with missing meetingId', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/minutes',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          minuteNumber: 'TEST-MISSING-MEETING'
        }
      });
      // Body-schema validation returns Fastify's default { message } (no dotted fieldErrors).
      expect(res.statusCode).toBe(400);
    });

    it('rejects POST /minutes with empty minuteNumber', async () => {
      const meetingRes = await app.inject({
        method: 'POST',
        url: '/meetings',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingDate: '2026-06-25',
          type: 'ordinária',
          isPublic: false
        }
      });
      const meetingId = meetingRes.json<{ id: number }>().id;

      const res = await app.inject({
        method: 'POST',
        url: '/minutes',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingId,
          minuteNumber: ''
        }
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects POST /minutes when meeting does not exist', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/minutes',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingId: 99999,
          minuteNumber: 'NONEXISTENT'
        }
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects POST /minutes when meeting already has minutes', async () => {
      const meetingRes = await app.inject({
        method: 'POST',
        url: '/meetings',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingDate: '2026-06-26',
          type: 'ordinária',
          isPublic: false
        }
      });
      const meetingId = meetingRes.json<{ id: number }>().id;

      // Create first minute
      const firstRes = await app.inject({
        method: 'POST',
        url: '/minutes',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingId,
          minuteNumber: 'DUPE-1'
        }
      });
      expect(firstRes.statusCode).toBe(201);

      // Try to create second minute for same meeting
      const secondRes = await app.inject({
        method: 'POST',
        url: '/minutes',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingId,
          minuteNumber: 'DUPE-2'
        }
      });
      expect(secondRes.statusCode).toBe(409);
    });

    it('rejects PATCH /:id/pending on a non-pending version', async () => {
      const meetingRes = await app.inject({
        method: 'POST',
        url: '/meetings',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingDate: '2026-06-27',
          type: 'ordinária',
          isPublic: false
        }
      });
      const meetingId = meetingRes.json<{ id: number }>().id;

      const createRes = await app.inject({
        method: 'POST',
        url: '/minutes',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingId,
          minuteNumber: 'NONPENDING'
        }
      });
      const minuteId = createRes.json<MinuteResponse>().id;

      // Finalize to move to awaiting approval
      await app.inject({
        method: 'POST',
        url: `/minutes/${minuteId}/finalize-draft`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {}
      });

      // Approve
      await app.inject({
        method: 'POST',
        url: `/minutes/${minuteId}/approve`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {}
      });

      // Now try to update pending (but current is approved, only edit-approved works)
      const res = await app.inject({
        method: 'PATCH',
        url: `/minutes/${minuteId}/pending`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: { content: {} }
      });
      expect(res.statusCode).toBe(409);
    });
  });

  describe('delete minute', () => {
    it('deletes a minute in draft status', async () => {
      const meetingRes = await app.inject({
        method: 'POST',
        url: '/meetings',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingDate: '2026-06-28',
          type: 'ordinária',
          isPublic: false
        }
      });
      const meetingId = meetingRes.json<{ id: number }>().id;

      const createRes = await app.inject({
        method: 'POST',
        url: '/minutes',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingId,
          minuteNumber: 'DELETE-TEST'
        }
      });
      const minuteId = createRes.json<MinuteResponse>().id;

      const res = await app.inject({
        method: 'DELETE',
        url: `/minutes/${minuteId}`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
      });
      expect(res.statusCode).toBe(204);

      // Verify it's deleted
      const getRes = await app.inject({
        method: 'GET',
        url: `/minutes/${minuteId}`,
        headers: { cookie: admin.cookie }
      });
      expect(getRes.statusCode).toBe(404);
    });

    it('blocks deleting a minute with approved version', async () => {
      const meetingRes = await app.inject({
        method: 'POST',
        url: '/meetings',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingDate: '2026-06-29',
          type: 'ordinária',
          isPublic: false
        }
      });
      const meetingId = meetingRes.json<{ id: number }>().id;

      const createRes = await app.inject({
        method: 'POST',
        url: '/minutes',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingId,
          minuteNumber: 'APPROVED-DELETE'
        }
      });
      const minuteId = createRes.json<MinuteResponse>().id;

      // Finalize and approve
      await app.inject({
        method: 'POST',
        url: `/minutes/${minuteId}/finalize-draft`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {}
      });

      await app.inject({
        method: 'POST',
        url: `/minutes/${minuteId}/approve`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {}
      });

      // Try to delete
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/minutes/${minuteId}`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
      });
      expect(deleteRes.statusCode).toBe(409);
    });

    it('blocks delete without Minutes:Delete permission', async () => {
      const meetingRes = await app.inject({
        method: 'POST',
        url: '/meetings',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingDate: '2026-06-30',
          type: 'ordinária',
          isPublic: false
        }
      });
      const meetingId = meetingRes.json<{ id: number }>().id;

      const createRes = await app.inject({
        method: 'POST',
        url: '/minutes',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingId,
          minuteNumber: 'RBAC-DELETE'
        }
      });
      const minuteId = createRes.json<MinuteResponse>().id;

      const res = await app.inject({
        method: 'DELETE',
        url: `/minutes/${minuteId}`,
        headers: { cookie: congregado.cookie, 'x-csrf-token': congregado.csrfToken }
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('RBAC negative cases', () => {
    it('blocks POST /minutes without Minutes:Create permission', async () => {
      const meetingRes = await app.inject({
        method: 'POST',
        url: '/meetings',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingDate: '2026-07-01',
          type: 'ordinária',
          isPublic: false
        }
      });
      const meetingId = meetingRes.json<{ id: number }>().id;

      const res = await app.inject({
        method: 'POST',
        url: '/minutes',
        headers: { cookie: congregado.cookie, 'x-csrf-token': congregado.csrfToken },
        payload: {
          meetingId,
          minuteNumber: 'RBAC-CREATE'
        }
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks PATCH /:id/pending without Minutes:Update permission', async () => {
      // Tesoureiro has read-only Atas (no Editar) → blocked at the permission gate.
      const res = await app.inject({
        method: 'PATCH',
        url: '/minutes/1/pending',
        headers: { cookie: tesoureiro.cookie, 'x-csrf-token': tesoureiro.csrfToken },
        payload: { content: {} }
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks POST /:id/approve without Minutes:Review permission', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/minutes/1/approve',
        headers: { cookie: congregado.cookie, 'x-csrf-token': congregado.csrfToken },
        payload: {}
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // NOTE: uq_default_template_per_type is a PARTIAL unique index — UNIQUE(meeting_type) WHERE
  // is_default — so each meeting type allows at most ONE default template but UNLIMITED non-default
  // templates. (It was previously a full UNIQUE(meeting_type, is_default), which capped each type at
  // ~2 rows and blocked all creation in seeded state.)
  describe('minute templates', () => {
    let nonDefaultId: number;
    let nonDefaultType: string;

    it('lists seeded minute templates (non-empty)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/minute-templates',
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<MinuteTemplateResponse[]>();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      const nonDefault = body.find((t) => !t.isDefault);
      expect(nonDefault).toBeDefined();
      nonDefaultId = nonDefault!.id;
      nonDefaultType = nonDefault!.meetingType;
    });

    it('retrieves a template by id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/minute-templates/${nonDefaultId}`,
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<MinuteTemplateResponse>().id).toBe(nonDefaultId);
    });

    // Core of the partial-index fix: a type that already has a (seeded) non-default template still
    // accepts additional non-default templates — the old full UNIQUE(type, is_default) blocked this.
    it('allows multiple non-default templates for the same meeting type', async () => {
      for (const name of ['Modelo Extra A', 'Modelo Extra B']) {
        const res = await app.inject({
          method: 'POST',
          url: '/minute-templates',
          headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
          payload: {
            meetingType: nonDefaultType,
            name,
            content: { type: 'doc', content: [] },
            isDefault: false
          }
        });
        expect(res.statusCode).toBe(201);
        expect(res.json<MinuteTemplateResponse>().isDefault).toBe(false);
      }
    });

    it('returns 404 for non-existent template', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/minute-templates/99999',
        headers: { cookie: admin.cookie }
      });
      expect(res.statusCode).toBe(404);
    });

    it('updates a non-default template name via PUT', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/minute-templates/${nonDefaultId}`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: { name: 'Template Atualizado' }
      });
      expect(res.statusCode).toBe(200);
      expect(res.json<MinuteTemplateResponse>().name).toBe('Template Atualizado');
    });

    it('deletes a non-default template (204→404), then re-creates one for that type (201)', async () => {
      const delRes = await app.inject({
        method: 'DELETE',
        url: `/minute-templates/${nonDefaultId}`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
      });
      expect(delRes.statusCode).toBe(204);

      const getRes = await app.inject({
        method: 'GET',
        url: `/minute-templates/${nonDefaultId}`,
        headers: { cookie: admin.cookie }
      });
      expect(getRes.statusCode).toBe(404);

      // The (type, is_default=false) slot is now free → create succeeds.
      const createRes = await app.inject({
        method: 'POST',
        url: '/minute-templates',
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken },
        payload: {
          meetingType: nonDefaultType,
          name: 'Novo Modelo Não Padrão',
          content: { type: 'doc', content: [] },
          isDefault: false,
          defaultAgendaItems: [{ title: 'Abertura', description: 'Oração de abertura' }]
        }
      });
      expect(createRes.statusCode).toBe(201);
      const created = createRes.json<MinuteTemplateResponse>();
      expect(created.meetingType).toBe(nonDefaultType);
      expect(created.isDefault).toBe(false);
      expect(created.defaultAgendaItems.length).toBe(1);
    });

    it('blocks deleting a default template (409)', async () => {
      const listRes = await app.inject({
        method: 'GET',
        url: '/minute-templates',
        headers: { cookie: admin.cookie }
      });
      const defaultTemplate = listRes.json<MinuteTemplateResponse[]>().find((t) => t.isDefault);
      expect(defaultTemplate).toBeDefined();

      const res = await app.inject({
        method: 'DELETE',
        url: `/minute-templates/${defaultTemplate!.id}`,
        headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrfToken }
      });
      expect(res.statusCode).toBe(409);
    });

    it('blocks template create/list without MinuteTemplates permission (403)', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/minute-templates',
        headers: { cookie: congregado.cookie, 'x-csrf-token': congregado.csrfToken },
        payload: {
          meetingType: 'ordinária',
          name: 'Template Não Autorizado',
          content: {}
        }
      });
      expect(createRes.statusCode).toBe(403);

      const listRes = await app.inject({
        method: 'GET',
        url: '/minute-templates',
        headers: { cookie: congregado.cookie }
      });
      expect(listRes.statusCode).toBe(403);
    });
  });
});
