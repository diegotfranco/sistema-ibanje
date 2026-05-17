import { test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const EMAIL = process.env.TEST_USER_EMAIL ?? '';
const PASSWORD = process.env.TEST_USER_PASSWORD ?? '';

if (!EMAIL || !PASSWORD) {
  throw new Error('Set TEST_USER_EMAIL and TEST_USER_PASSWORD in apps/web/.env.local');
}

type RouteSpec = { path: string; label: string };

const ROUTES: RouteSpec[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/attenders', label: 'Congregados' },
  { path: '/payment-methods', label: 'Formas de pagamento' },
  { path: '/designated-funds', label: 'Fundos designados' },
  { path: '/income-categories', label: 'Categorias de entrada' },
  { path: '/expense-categories', label: 'Categorias de despesa' },
  { path: '/income-entries', label: 'Entradas' },
  { path: '/expense-entries', label: 'Despesas' },
  { path: '/monthly-closings', label: 'Fechamentos mensais' },
  { path: '/reports', label: 'Relatórios' },
  { path: '/meetings', label: 'Pautas' },
  { path: '/minutes', label: 'Atas' },
  { path: '/minute-templates', label: 'Modelos de ata' },
  { path: '/membership-letters', label: 'Cartas de membresia' },
  { path: '/roles', label: 'Papéis' },
  { path: '/users', label: 'Usuários' },
  { path: '/church-settings', label: 'Configurações da igreja' },
  { path: '/me', label: 'Meu perfil' }
];

const PUBLIC_ROUTES: RouteSpec[] = [
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Cadastro' },
  { path: '/forgot-password', label: 'Esqueci minha senha' }
];

type ViolationRow = {
  route: string;
  label: string;
  theme: 'light' | 'dark';
  id: string;
  impact: string;
  help: string;
  helpUrl: string;
  nodes: { target: string; failureSummary: string }[];
};

const allViolations: ViolationRow[] = [];

async function applyTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    localStorage.setItem('theme', t);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
  }, theme);
}

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|me)/, { timeout: 15_000 });
}

async function auditRoute(page: Page, route: RouteSpec, theme: 'light' | 'dark') {
  await page.goto(route.path, { waitUntil: 'domcontentloaded' });
  await applyTheme(page, theme);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(400);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  for (const v of results.violations) {
    allViolations.push({
      route: route.path,
      label: route.label,
      theme,
      id: v.id,
      impact: v.impact ?? 'unknown',
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => ({
        target: n.target.join(' '),
        failureSummary: n.failureSummary ?? ''
      }))
    });
  }
}

test.describe.serial('WCAG 2.1 AA audit', () => {
  test('Public routes (light + dark)', async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      for (const theme of ['light', 'dark'] as const) {
        await auditRoute(page, route, theme);
      }
    }
  });

  test('Protected routes (light + dark)', async ({ page }) => {
    test.setTimeout(600_000);
    await login(page);
    for (const route of ROUTES) {
      for (const theme of ['light', 'dark'] as const) {
        await auditRoute(page, route, theme);
      }
    }
  });

  test.afterAll(async () => {
    const path = 'a11y-report.md';
    mkdirSync(dirname(path) || '.', { recursive: true });

    const byRoute = new Map<string, ViolationRow[]>();
    for (const v of allViolations) {
      const k = `${v.route} (${v.theme})`;
      if (!byRoute.has(k)) byRoute.set(k, []);
      byRoute.get(k)!.push(v);
    }

    const contrastViolations = allViolations.filter((v) => v.id === 'color-contrast');
    const moneyContrast = contrastViolations.filter((v) =>
      v.nodes.some((n) => /money|emerald|red-600|text-red/.test(n.target))
    );

    const lines: string[] = [];
    lines.push('# WCAG 2.1 AA Audit Report');
    lines.push(`\nGenerated: ${new Date().toISOString()}`);
    lines.push(`\n**Total violations:** ${allViolations.length}`);
    lines.push(`**Contrast violations:** ${contrastViolations.length}`);
    lines.push(`**Money-color contrast violations (flagged, not fixed):** ${moneyContrast.length}`);
    lines.push(`**Routes audited:** ${PUBLIC_ROUTES.length + ROUTES.length} × 2 themes\n`);

    if (allViolations.length === 0) {
      lines.push('\n## All routes pass WCAG 2.1 AA ✓\n');
    } else {
      lines.push('\n## Violations by route\n');
      for (const [key, vs] of [...byRoute.entries()].sort()) {
        lines.push(`\n### ${key}\n`);
        for (const v of vs) {
          lines.push(`- **${v.id}** (${v.impact}) — ${v.help} [docs](${v.helpUrl})`);
          for (const n of v.nodes.slice(0, 3)) {
            lines.push(`  - \`${n.target}\``);
            if (n.failureSummary) lines.push(`    - ${n.failureSummary.split('\n').join(' / ')}`);
          }
          if (v.nodes.length > 3) lines.push(`  - …and ${v.nodes.length - 3} more`);
        }
      }
    }

    if (moneyContrast.length > 0) {
      lines.push('\n## Money-color exceptions (NOT auto-fixed)\n');
      for (const v of moneyContrast) {
        lines.push(`- ${v.route} (${v.theme}): \`${v.nodes[0].target}\``);
      }
    }

    writeFileSync(path, lines.join('\n'));
    console.log(`\nReport written to ${path}`);
  });
});
