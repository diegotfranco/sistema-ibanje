import { describe, it, expect } from 'vitest';
import { MinuteTemplateFormSchema, AgendaItemTemplateSchema } from './schema';

describe('AgendaItemTemplateSchema', () => {
  it('accepts a valid agenda item with title', () => {
    expect(AgendaItemTemplateSchema.safeParse({ title: 'Abertura' }).success).toBe(true);
  });

  it('rejects an empty title', () => {
    const r = AgendaItemTemplateSchema.safeParse({ title: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'title')?.message).toBe('Título obrigatório');
    }
  });

  it('rejects a title longer than 256 chars', () => {
    const r = AgendaItemTemplateSchema.safeParse({ title: 'a'.repeat(257) });
    expect(r.success).toBe(false);
  });

  it('accepts an optional description up to 2048 chars', () => {
    expect(
      AgendaItemTemplateSchema.safeParse({
        title: 'Abertura',
        description: 'Explicação do item de agenda'
      }).success
    ).toBe(true);
  });

  it('rejects a description longer than 2048 chars', () => {
    const r = AgendaItemTemplateSchema.safeParse({
      title: 'Abertura',
      description: 'a'.repeat(2049)
    });
    expect(r.success).toBe(false);
  });

  it('accepts an empty string for description', () => {
    expect(
      AgendaItemTemplateSchema.safeParse({
        title: 'Abertura',
        description: ''
      }).success
    ).toBe(true);
  });
});

describe('MinuteTemplateFormSchema', () => {
  const validBase = {
    meetingType: 'ordinária',
    name: 'Template de Assembleia',
    content: { blocks: [] },
    isDefault: false,
    defaultAgendaItems: []
  };

  it('accepts a valid minute template', () => {
    expect(MinuteTemplateFormSchema.safeParse(validBase).success).toBe(true);
  });

  it('rejects an empty meetingType', () => {
    const r = MinuteTemplateFormSchema.safeParse({ ...validBase, meetingType: '' });
    expect(r.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const r = MinuteTemplateFormSchema.safeParse({ ...validBase, name: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'name')?.message).toBe('Nome obrigatório');
    }
  });

  it('rejects a name longer than 128 chars', () => {
    const r = MinuteTemplateFormSchema.safeParse({
      ...validBase,
      name: 'a'.repeat(129)
    });
    expect(r.success).toBe(false);
  });

  it('requires a valid content object', () => {
    const r = MinuteTemplateFormSchema.safeParse({ ...validBase, content: null });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.find((i) => i.path[0] === 'content')?.message).toBe(
        'Conteúdo obrigatório'
      );
    }
  });

  it('accepts isDefault as true or false', () => {
    expect(MinuteTemplateFormSchema.safeParse({ ...validBase, isDefault: true }).success).toBe(
      true
    );
    expect(MinuteTemplateFormSchema.safeParse({ ...validBase, isDefault: false }).success).toBe(
      true
    );
  });

  it('defaults isDefault to false when not provided', () => {
    const r = MinuteTemplateFormSchema.safeParse({
      meetingType: 'ordinária',
      name: 'Template',
      content: { blocks: [] }
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.isDefault).toBe(false);
    }
  });

  it('accepts an array of valid agenda items', () => {
    expect(
      MinuteTemplateFormSchema.safeParse({
        ...validBase,
        defaultAgendaItems: [
          { title: 'Abertura' },
          { title: 'Assuntos diversos', description: 'Discusses various matters' }
        ]
      }).success
    ).toBe(true);
  });

  it('defaults defaultAgendaItems to empty array', () => {
    const r = MinuteTemplateFormSchema.safeParse({
      meetingType: 'ordinária',
      name: 'Template',
      content: { blocks: [] }
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.defaultAgendaItems).toEqual([]);
    }
  });

  it('rejects invalid agenda items in the array', () => {
    const r = MinuteTemplateFormSchema.safeParse({
      ...validBase,
      defaultAgendaItems: [{ title: '' }]
    });
    expect(r.success).toBe(false);
  });
});
