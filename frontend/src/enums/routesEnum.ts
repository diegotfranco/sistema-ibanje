const RoutesEnum = {
  ROOT: { path: '/' },

  ENTRADAS: { path: '/entradas' },
  EXTRATO_ENTRADAS: { index: true, fullPath: '/entradas/' },
  ORIGENS_ENTRADAS: { path: 'origens', fullPath: '/entradas/origens' },
  LANCAMENTOS_ENTRADAS: { path: 'lancamentos', fullPath: '/entradas/lancamentos' },
  SAIDAS: { path: '/saidas' },
  EXTRATO_SAIDAS: { index: true, fullPath: '/saidas/' },
  DESTINOS_SAIDAS: { path: 'destinos', fullPath: '/saidas/destinos' },
  LANCAMENTOS_SAIDAS: { path: 'lancamentos', fullPath: '/saidas/lancamentos' },
  EXTRATO: { path: '/extrato' },
  FORMAS_PAGAMENTOS: { path: '/formaspagamentos' },

  MEMBROS: { path: '/membros' },
  CARGOS: { path: '/cargos' },
  PERMISSOES: { path: '/permissoes' },

  AREAS: { path: '/areas' },
  STATUS: { path: '/status' },

  LOGIN: { path: '/login' },
  CADASTRO: { path: '/cadastro' },
  DASHBOARD: { path: '/painel' },

  UNAUTHORIZED: { path: '/unauthorized' }
} as const;

export default RoutesEnum;
