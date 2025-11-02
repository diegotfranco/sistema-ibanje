const routes = {
  ROOT: { path: '/' },
  DASHBOARD: { path: '/painel' },

  INCOME: { path: '/entradas' },
  INCOME_OVERVIEW: { index: true, fullPath: '/entradas/' },
  INCOME_CATEGORIES: { path: 'origens', fullPath: '/entradas/origens' },
  INCOME_ENTRIES: { path: 'lancamentos', fullPath: '/entradas/lancamentos' },

  EXPENSES: { path: '/saidas' },
  EXPENSES_OVERVIEW: { index: true, fullPath: '/saidas/' },
  EXPENSES_CATEGORIES: { path: 'destinos', fullPath: '/saidas/destinos' },
  EXPENSES_ENTRIES: { path: 'lancamentos', fullPath: '/saidas/lancamentos' },

  REPORTS: { path: '/extrato' },
  PAYMENT_METHODS: { path: '/formaspagamentos' },

  ATAS: { path: '/atas' },
  ATAS_OVERVIEW: { index: true, fullPath: '/atas/resumo' },
  ATAS_VIEW: { path: 'visualizar', fullPath: '/atas/visualizar' },
  ATAS_ENTRIES: { path: 'lancamento', fullPath: '/atas/lancamento' },

  PAUTAS: { path: '/pautas' },
  PAUTAS_VIEW: { index: true, fullPath: '/pautas/visualizar' },
  PAUTAS_ENTRIES: { path: 'lancamento', fullPath: '/pautas/lancamento' },

  MEMBERS: { path: '/membros' },
  ROLES: { path: '/cargos' },
  PERMISSIONS: { path: '/permissoes' },

  AREAS: { path: '/areas' },
  STATUS: { path: '/status' },

  LOGIN: { path: '/login' },
  SIGNUP: { path: '/cadastro' },

  FORGOT_PASSWORD: { path: '/esqueci-a-senha' },
  FORGOT_PASSWORD_EMAIL_SENT: { path: '/esqueci-a-senha/enviado' },
  RESET_PASSWORD: { path: '/redefinir-senha' },

  UNAUTHORIZED: { path: '/unauthorized' }
} as const;

export default routes;
