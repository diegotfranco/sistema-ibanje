export const AREA = {
  MEMBROS: 1,
  USUARIOS: 2,
  ENTRADAS: 3,
  MOVIMENTACOES_ENTRADAS: 4,
  SAIDAS: 5,
  MOVIMENTACOES_SAIDAS: 6,
  FORMAS_PAGAMENTO: 7,
  PERMISSOES: 8,
  AREAS: 9,
  STATUS: 10,
  DASHBOARD: 11
} as const;

export const ACAO = {
  VISUALIZAR: 1,
  CRIAR: 2,
  EDITAR: 3,
  REMOVER: 4,
  EXPORTAR: 5
} as const;

export type AreaKey = keyof typeof AREA;
export type AcaoKey = keyof typeof ACAO;
