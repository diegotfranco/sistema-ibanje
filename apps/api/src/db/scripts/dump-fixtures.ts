/**
 * One-shot dump of the legacy SQLite (`ibanje.db`) into versioned JSON fixtures
 * under `apps/api/src/db/fixtures/`. After this script runs and the output is
 * committed, `ibanje.db` can be deleted permanently.
 *
 * What we dump:
 *   - attenders.json          — cleaned `membros` table
 *   - campaigns.json   — one extra fund per distinct campanha_nome found
 *                               in `entradas` (base 6 are in seed-data.ts)
 *   - income_entries.json     — `entradas` rows fanned out per amount column,
 *                               filtered to referenceDate >= today - 5y
 *   - expense_entries.json    — `saidas` rows mapped to seeded categories via
 *                               DESTINO_RULES, filtered to the 5y window
 *   - dump-report.md          — audit of campanha fan-out, unmapped destinos,
 *                               unmatched names, skipped rows
 *
 * Foreign keys are emitted by NAME (categoryName, attenderName, etc.) so the
 * seed re-resolves ids on import without depending on auto-increment ids.
 */
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures');
const LEGACY_SQLITE_PATH =
  process.env.LEGACY_SQLITE_PATH ?? path.resolve(process.cwd(), 'ibanje.db');

// 5-year window cutoff — finance entries with referenceDate < cutoff are dropped.
const FIVE_YEARS_MS = 5 * 365.25 * 24 * 60 * 60 * 1000;
const CUTOFF_DATE = new Date(Date.now() - FIVE_YEARS_MS).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// helpers (small, inlined — not worth exporting from seed-data.ts)
// ---------------------------------------------------------------------------
function clean(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}
function cleanCep(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  const digits = s.replace(/\D/g, '');
  return digits.length === 8 ? digits : null;
}
function cleanUf(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  const up = s.toUpperCase();
  return up.length === 2 ? up : null;
}
function cleanPhone(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  return s.length > 16 ? s.slice(0, 16) : s;
}
function cleanBirthDate(s: string | null): string | null {
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const year = Number(s.slice(0, 4));
  if (year < 1900 || year > 2026) return null;
  return s;
}
function normalizeName(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function parseAmount(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function fmtMoney(n: number): string {
  return n.toFixed(2);
}
function isValidDate(s: string | null): boolean {
  if (!s) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (y < 2020 || y > 2026) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  return true;
}
function repairDate(s: string | null): string | null {
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (m > 12 && d >= 1 && d <= 12) {
    return `${String(y).padStart(4, '0')}-${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}`;
  }
  return s;
}
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}
const LOWERCASE_CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

function titleCase(s: string): string {
  return s
    .split(' ')
    .filter(Boolean)
    .map((w, i) => {
      if (i > 0 && LOWERCASE_CONNECTORS.has(w.toLowerCase())) return w.toLowerCase();
      return w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1).toLocaleLowerCase('pt-BR');
    })
    .join(' ');
}

// ---------------------------------------------------------------------------
// destino → expense category mapping (preserves the legacy regex table)
// ---------------------------------------------------------------------------
type DestinoRule = { match: RegExp; category: string };
const DESTINO_RULES: DestinoRule[] = [
  {
    match: /honorari[oa] pastoral|honorario pr|honor pr|honorario do pastor/,
    category: 'Honorários Pastorais'
  },
  {
    match: /ferias.*pastor|um terco de ferias|13.*pastor|13.*salario/,
    category: 'Honorários Pastorais'
  },
  { match: /fgtm/, category: 'FGTM' },
  { match: /darf|inss|imposto/, category: 'Encargos' },
  {
    match: /tarifa banc|cesta de relacion|tarifa sicredi|tarifa.*banco/,
    category: 'Tarifa Bancária'
  },
  { match: /agua|guariroba/, category: 'Água' },
  { match: /energisa|energia|^luz| luz/, category: 'Energia' },
  { match: /internet|claro|telefone/, category: 'Internet / Telefone' },
  { match: /digital seguranca|seguranca|vigilancia/, category: 'Vigilância Patrimonial' },
  { match: /contador|contabil/, category: 'Contador' },
  {
    match: /material de expediente|expediente|papelaria|escritorio|impressos|copia/,
    category: 'Material de Expediente'
  },
  { match: /limpe[sz]a|material de limpeza|higiene/, category: 'Material de Limpeza' },
  { match: /jardin/, category: 'Manutenção Predial' },
  { match: /encanamento|hidraulic|reparo hidr/, category: 'Reparo Hidráulico' },
  { match: /eletric|reparo elet/, category: 'Reparo Elétrico' },
  { match: /chave|chaveiro|fechadura/, category: 'Manutenção Predial' },
  { match: /material construcao|construcao|tinta|pintura|fachada/, category: 'Manutenção Predial' },
  { match: /manuten/, category: 'Manutenção Predial' },
  { match: /combustivel/, category: 'Auxílio Combustível' },
  {
    match: /pam|plano de auxilio missionario|plano auxilio.*seminarista|auxilio.*missionario/,
    category: 'PAM'
  },
  { match: /missoes nacionais|missao nacional/, category: 'Missões Nacionais' },
  { match: /miss[oõ]+es mundiais|missao mundial|missoes mund/, category: 'Missões Mundiais' },
  { match: /uniao feminina|gideoes/, category: 'Missões Nacionais' },
  {
    match: /auxilio a seminarista|mensalidade seminarista|seminarista/,
    category: 'Auxílio a Seminarista'
  },
  {
    match: /auxilio a pr em formacao|pastor em formacao|pos graduacao|aux pos|aux pr formacao/,
    category: 'Auxílio a Pastor em Formação'
  },
  { match: /abono|pecunia/, category: 'Honorários Pastorais' },
  { match: /plano cooperativo/, category: 'Plano Cooperativo' },
  { match: /acibams/, category: 'Acibams' },
  { match: /compra de equip|aquisicao de equip|equipamento/, category: 'Compra de Equipamentos' },
  {
    match: /retiro|acampamento|encontro|confraterniz|pascoa|natal|aniversari|evento/,
    category: 'Despesas com Eventos'
  },
  { match: /didatic|literatura|livros|ebd/, category: 'Material Didático' },
  { match: /gratific|obreiro convidado|pregador/, category: 'Gratificações' },
  { match: /generos alimenticios|alimentacao|alimento/, category: 'Despesas com Eventos' },
  { match: /registro de ata|cartorio/, category: 'Cartório / Registros' }
];
const FALLBACK_EXPENSE_CATEGORY = 'Outras Despesas';

function mapDestinoToCategory(destino: string): string {
  const norm = normalizeName(destino);
  for (const rule of DESTINO_RULES) {
    if (rule.match.test(norm)) return rule.category;
  }
  return FALLBACK_EXPENSE_CATEGORY;
}

function mapForma(forma: string | null): string {
  const norm = normalizeName(forma);
  if (norm.includes('transf')) return 'Transferência Bancária';
  return 'Dinheiro';
}

// ---------------------------------------------------------------------------
// campanha clustering — normalize spelling/whitespace variants into canonical
// campaign names. Manual alias map covers the obvious typos.
// ---------------------------------------------------------------------------
const CAMPANHA_ALIASES: Record<string, string> = {
  // typos (normalized form, applied at clustering time)
  compaicao: 'compaixao',
  anivesario: 'aniversario',
  planfetos: 'panfletos'
};

// Display-level typo corrections, applied to the raw (accented) spelling
// before title-casing so the fund name reads correctly.
const CAMPANHA_DISPLAY_FIXES: { pattern: RegExp; replacement: string }[] = [
  { pattern: /compaição/gi, replacement: 'compaixão' },
  { pattern: /anivesário/gi, replacement: 'aniversário' },
  { pattern: /planfetos/gi, replacement: 'panfletos' }
];

function canonicalizeCampanha(raw: string): string {
  // Normalize: trim, collapse whitespace, lowercase, deaccent.
  const norm = normalizeName(raw);
  // Apply per-word alias replacements for known typos.
  const fixed = norm
    .split(' ')
    .map((w) => CAMPANHA_ALIASES[w] ?? w)
    .join(' ');
  return fixed;
}

function cleanRawCampanha(raw: string): string {
  // Trim + collapse internal whitespace, fix known display-level typos,
  // preserve accents and casing on the rest.
  let s = raw.trim().replace(/\s+/g, ' ');
  for (const { pattern, replacement } of CAMPANHA_DISPLAY_FIXES) {
    s = s.replace(pattern, replacement);
  }
  return s;
}

/**
 * Display name uses the most common ORIGINAL spelling (accents preserved) and
 * applies title-case so we end up with "Desafio Construção" rather than
 * "Desafio Construcao". Aliases like `compaicao→compaixao` are applied first
 * so misspellings cluster, but the display string is rebuilt from real text.
 */
function displayCampanha(rawSpellings: Map<string, number>): string {
  let bestRaw = '';
  let bestCount = -1;
  for (const [raw, count] of rawSpellings) {
    if (count > bestCount) {
      bestCount = count;
      bestRaw = raw;
    }
  }
  return titleCase(cleanRawCampanha(bestRaw));
}

// ---------------------------------------------------------------------------
// attender matching at dump time — same fuzzy strategy the old seed used,
// but resolved once and frozen into the fixtures.
// ---------------------------------------------------------------------------
type AttenderRow = { name: string; norm: string };

type MatchOutcome = {
  matchedName: string | null;
  kind: 'exact' | 'fuzzy' | 'none';
  reason?: string;
};

function buildAttenderMatcher(rows: AttenderRow[]) {
  const byNorm = new Map<string, AttenderRow>();
  for (const r of rows) if (r.norm) byNorm.set(r.norm, r);
  const all = [...byNorm.values()];

  return (legacyName: string | null | undefined): MatchOutcome => {
    if (!legacyName) return { matchedName: null, kind: 'none' };
    const norm = normalizeName(legacyName);
    if (!norm) return { matchedName: null, kind: 'none' };

    const exact = byNorm.get(norm);
    if (exact) return { matchedName: exact.name, kind: 'exact' };

    if (
      /anonim|rendimento|cofre|poupanca|abertura|venda|familia|partilhamento|igreja|terenos|pulpito/.test(
        norm
      )
    ) {
      return { matchedName: null, kind: 'none' };
    }

    const legacyTokens = norm.split(' ').filter((t) => t.length >= 2);
    if (legacyTokens.length >= 2) {
      const subset = all.filter((a) => {
        const tokens = new Set(a.norm.split(' '));
        return legacyTokens.every((t) => tokens.has(t));
      });
      if (subset.length === 1) {
        return { matchedName: subset[0].name, kind: 'fuzzy', reason: 'token-subset' };
      }
    }

    const maxDist = norm.length <= 8 ? 1 : 2;
    const close = all
      .map((a) => ({ a, dist: levenshtein(norm, a.norm) }))
      .filter((e) => e.dist <= maxDist)
      .sort((x, y) => x.dist - y.dist);
    if (close.length === 1 || (close.length > 1 && close[0].dist < close[1].dist)) {
      return {
        matchedName: close[0].a.name,
        kind: 'fuzzy',
        reason: `levenshtein=${close[0].dist}`
      };
    }
    return { matchedName: null, kind: 'none' };
  };
}

// ---------------------------------------------------------------------------
// legacy types (just the columns we read)
// ---------------------------------------------------------------------------
type LegacyMembro = {
  nome: string | null;
  data_nascimento: string | null;
  endereco: string | null;
  numero: number | null;
  complemento: string | null;
  bairro: string | null;
  uf: string | null;
  cidade: string | null;
  cep: string | null;
  email: string | null;
  celular: string | null;
};
type LegacyEntrada = {
  nome: string | null;
  data_referencia: string;
  data_deposito: string;
  dizimo: number | string | null;
  doacao_terenos: number | string | null;
  doacao_missoes: number | string | null;
  doacao_pam: number | string | null;
  campanha_nome: string | null;
  doacao_campanha: number | string | null;
  forma_pagamento: string;
};
type LegacySaida = { destino: string; valor: number; data: string };

// ---------------------------------------------------------------------------
// emitted fixture shapes (FK by NAME, stable across seed runs)
// ---------------------------------------------------------------------------
type AttenderFixture = {
  name: string;
  birthDate: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
};
type CampaignFixture = { name: string; description?: string | null };
type IncomeEntryFixture = {
  referenceDate: string;
  depositDate: string;
  amount: string;
  categoryName: string;
  attenderName: string | null;
  paymentMethodName: string;
  campaignName: string | null;
  notes: string | null;
};
type ExpenseEntryFixture = {
  date: string;
  total: string;
  amount: string;
  installment: number;
  totalInstallments: number;
  categoryName: string;
  paymentMethodName: string;
  campaignName: string | null;
  notes: string | null;
};

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  if (!existsSync(LEGACY_SQLITE_PATH)) {
    console.error(`Legacy SQLite not found at ${LEGACY_SQLITE_PATH}`);
    process.exit(1);
  }
  if (!existsSync(FIXTURES_DIR)) mkdirSync(FIXTURES_DIR, { recursive: true });

  console.log(`Reading legacy SQLite: ${LEGACY_SQLITE_PATH}`);
  const legacy = new DatabaseSync(LEGACY_SQLITE_PATH, { readOnly: true });
  let membros: LegacyMembro[];
  let entradas: LegacyEntrada[];
  let saidas: LegacySaida[];
  try {
    membros = legacy.prepare('SELECT * FROM membros').all() as unknown as LegacyMembro[];
    entradas = legacy.prepare('SELECT * FROM entradas').all() as unknown as LegacyEntrada[];
    saidas = legacy.prepare('SELECT * FROM saidas').all() as unknown as LegacySaida[];
  } finally {
    legacy.close();
  }
  console.log(
    `Legacy counts: ${membros.length} membros, ${entradas.length} entradas, ${saidas.length} saidas`
  );
  console.log(`Finance window cutoff: referenceDate >= ${CUTOFF_DATE}`);

  // --- attenders -----------------------------------------------------------
  const attendersFixture: AttenderFixture[] = membros
    .map((m) => {
      const name = clean(m.nome);
      if (!name) return null;
      return {
        name,
        birthDate: cleanBirthDate(clean(m.data_nascimento)),
        addressStreet: clean(m.endereco),
        addressNumber:
          typeof m.numero === 'number' && Number.isFinite(m.numero) ? String(m.numero) : null,
        addressComplement: clean(m.complemento),
        addressDistrict: clean(m.bairro),
        state: cleanUf(m.uf),
        city: clean(m.cidade),
        postalCode: cleanCep(m.cep),
        email: clean(m.email),
        phone: cleanPhone(m.celular)
      };
    })
    .filter((a): a is AttenderFixture => a !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  // Build matcher against the attender names that will exist after seed.
  const matchAttender = buildAttenderMatcher(
    attendersFixture.map((a) => ({ name: a.name, norm: normalizeName(a.name) }))
  );

  // --- campanha fan-out ----------------------------------------------------
  const campanhaCountsByCanonical = new Map<
    string,
    { display: string; count: number; rawSpellings: Map<string, number> }
  >();
  for (const e of entradas) {
    const raw = clean(e.campanha_nome);
    if (!raw) continue;
    const canonical = canonicalizeCampanha(raw);
    if (!canonical) continue;
    const existing = campanhaCountsByCanonical.get(canonical);
    if (existing) {
      existing.count++;
      existing.rawSpellings.set(raw, (existing.rawSpellings.get(raw) ?? 0) + 1);
    } else {
      campanhaCountsByCanonical.set(canonical, {
        display: '',
        count: 1,
        rawSpellings: new Map([[raw, 1]])
      });
    }
  }
  for (const info of campanhaCountsByCanonical.values()) {
    info.display = displayCampanha(info.rawSpellings);
  }

  // Avoid colliding with base funds (case-insensitive).
  const BASE_FUND_NORM = new Set([
    'fundo de obras',
    'fundo missionario',
    'dia das criancas',
    'terenos',
    'pam'
  ]);
  const campaignsFixture: CampaignFixture[] = [...campanhaCountsByCanonical.entries()]
    .filter(([canonical]) => !BASE_FUND_NORM.has(canonical))
    .sort((a, b) => a[1].display.localeCompare(b[1].display, 'pt-BR'))
    .map(([, info]) => ({
      name: info.display,
      description: `Campanha histórica (${info.count} lançamentos): ${[...info.rawSpellings.keys()].slice(0, 3).join(' / ')}`
    }));

  const canonicalToDisplayName = new Map<string, string>();
  for (const [canonical, info] of campanhaCountsByCanonical) {
    canonicalToDisplayName.set(canonical, info.display);
  }

  // --- income entries ------------------------------------------------------
  const incomeFixture: IncomeEntryFixture[] = [];
  let skippedBadDateIncome = 0;
  let skippedOutsideWindowIncome = 0;
  const unmatchedNameCounts = new Map<string, number>();
  const fuzzyMatchedSamples: { legacy: string; matched: string; reason: string }[] = [];

  for (const e of entradas) {
    const refDate = repairDate(clean(e.data_referencia));
    if (!isValidDate(refDate)) {
      skippedBadDateIncome++;
      continue;
    }
    if (refDate! < CUTOFF_DATE) {
      skippedOutsideWindowIncome++;
      continue;
    }
    const depDate = repairDate(clean(e.data_deposito)) ?? refDate!;
    const paymentMethodName = mapForma(e.forma_pagamento);
    const match = matchAttender(e.nome);
    const attenderName = match.matchedName;
    if (match.kind === 'fuzzy' && fuzzyMatchedSamples.length < 30) {
      fuzzyMatchedSamples.push({
        legacy: e.nome ?? '',
        matched: match.matchedName ?? '',
        reason: match.reason ?? ''
      });
    } else if (match.kind === 'none' && e.nome) {
      const norm = normalizeName(e.nome);
      if (
        norm.length >= 3 &&
        !/anonim|rendimento|cofre|poupanca|abertura|venda|familia|partilhamento|igreja|terenos|pulpito/.test(
          norm
        )
      ) {
        unmatchedNameCounts.set(e.nome, (unmatchedNameCounts.get(e.nome) ?? 0) + 1);
      }
    }
    const baseNote = null;

    const dizimo = parseAmount(e.dizimo);
    const terenos = parseAmount(e.doacao_terenos);
    const missoes = parseAmount(e.doacao_missoes);
    const pam = parseAmount(e.doacao_pam);
    const campanha = parseAmount(e.doacao_campanha);
    const campanhaRaw = clean(e.campanha_nome);

    const common = {
      referenceDate: refDate!,
      depositDate: isValidDate(depDate) ? depDate! : refDate!,
      attenderName,
      paymentMethodName
    };

    if (dizimo > 0) {
      incomeFixture.push({
        ...common,
        amount: fmtMoney(dizimo),
        categoryName: 'Dízimo',
        campaignName: null,
        notes: baseNote
      });
    }
    if (terenos > 0) {
      incomeFixture.push({
        ...common,
        amount: fmtMoney(terenos),
        categoryName: 'Doação',
        campaignName: 'Terenos',
        notes: baseNote
      });
    }
    if (missoes > 0) {
      incomeFixture.push({
        ...common,
        amount: fmtMoney(missoes),
        categoryName: 'Oferta',
        campaignName: 'Fundo Missionário',
        notes: baseNote
      });
    }
    if (pam > 0) {
      incomeFixture.push({
        ...common,
        amount: fmtMoney(pam),
        categoryName: 'Oferta',
        campaignName: 'PAM',
        notes: baseNote
      });
    }
    if (campanha > 0) {
      const canonical = campanhaRaw ? canonicalizeCampanha(campanhaRaw) : '';
      const fundName = canonical
        ? BASE_FUND_NORM.has(canonical)
          ? titleCase(canonical)
          : (canonicalToDisplayName.get(canonical) ?? titleCase(canonical))
        : null;
      const campNote = [baseNote, campanhaRaw ? `Campanha: "${campanhaRaw}"` : null]
        .filter(Boolean)
        .join(' | ');
      incomeFixture.push({
        ...common,
        amount: fmtMoney(campanha),
        categoryName: 'Oferta',
        campaignName: fundName,
        notes: campNote || null
      });
    }
  }

  // Stable order: by referenceDate, then attenderName, then amount.
  incomeFixture.sort((a, b) => {
    if (a.referenceDate !== b.referenceDate) return a.referenceDate.localeCompare(b.referenceDate);
    const an = a.attenderName ?? '';
    const bn = b.attenderName ?? '';
    if (an !== bn) return an.localeCompare(bn, 'pt-BR');
    return a.amount.localeCompare(b.amount);
  });

  // --- expense entries -----------------------------------------------------
  const expenseFixture: ExpenseEntryFixture[] = [];
  let skippedBadDateExpense = 0;
  let skippedOutsideWindowExpense = 0;
  const unmappedDestinoCounts = new Map<string, number>();

  for (const s of saidas) {
    const refDate = repairDate(clean(s.data));
    const destino = clean(s.destino);
    if (!isValidDate(refDate)) {
      skippedBadDateExpense++;
      continue;
    }
    if (refDate! < CUTOFF_DATE) {
      skippedOutsideWindowExpense++;
      continue;
    }
    if (!destino || !(s.valor > 0)) continue;
    const categoryName = mapDestinoToCategory(destino);
    if (categoryName === FALLBACK_EXPENSE_CATEGORY) {
      unmappedDestinoCounts.set(destino, (unmappedDestinoCounts.get(destino) ?? 0) + 1);
    }
    const amount = fmtMoney(s.valor);
    expenseFixture.push({
      date: refDate!,
      total: amount,
      amount,
      installment: 1,
      totalInstallments: 1,
      categoryName,
      paymentMethodName: 'Transferência Bancária',
      campaignName: null,
      notes: destino.length > 1000 ? destino.slice(0, 1000) : destino
    });
  }
  expenseFixture.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.categoryName.localeCompare(b.categoryName, 'pt-BR');
  });

  // --- write files ---------------------------------------------------------
  const writeJson = (filename: string, data: unknown) => {
    writeFileSync(path.join(FIXTURES_DIR, filename), JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`  wrote ${filename}`);
  };

  writeJson('attenders.json', attendersFixture);
  writeJson('campaigns.json', campaignsFixture);
  writeJson('income_entries.json', incomeFixture);
  writeJson('expense_entries.json', expenseFixture);

  // --- dump-report.md ------------------------------------------------------
  const lines: string[] = [];
  lines.push('# Dump report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Cutoff (5-year window): \`${CUTOFF_DATE}\``);
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  lines.push(
    `- attenders.json: **${attendersFixture.length}** rows (from ${membros.length} membros)`
  );
  lines.push(
    `- income_entries.json: **${incomeFixture.length}** rows (from ${entradas.length} entradas; ${skippedOutsideWindowIncome} outside window, ${skippedBadDateIncome} bad dates)`
  );
  lines.push(
    `- expense_entries.json: **${expenseFixture.length}** rows (from ${saidas.length} saidas; ${skippedOutsideWindowExpense} outside window, ${skippedBadDateExpense} bad dates)`
  );
  lines.push(
    `- campaigns.json: **${campaignsFixture.length}** extra campanha funds (beyond the 5 base funds in seed-data.ts)`
  );
  lines.push('');

  lines.push('## Campanha fan-out');
  lines.push('');
  lines.push('Each distinct (normalized) `campanha_nome` becomes its own campaign. ');
  lines.push(
    'Whitespace, casing, accents, and a small alias map (`compaicao→compaixao`, `anivesario→aniversario`, `planfetos→panfletos`) are normalized to collapse spelling variants.'
  );
  lines.push('');
  lines.push('| Fund | Legacy lançamentos | Raw spellings observed |');
  lines.push('|---|---:|---|');
  const sortedCampanhas = [...campanhaCountsByCanonical.entries()].sort(
    (a, b) => b[1].count - a[1].count
  );
  for (const [, info] of sortedCampanhas) {
    const raws = [...info.rawSpellings.keys()].map((s) => `\`${s}\``).join(', ');
    lines.push(`| ${info.display} | ${info.count} | ${raws} |`);
  }
  lines.push('');

  lines.push('## Attender matching');
  lines.push('');
  lines.push(`- Fuzzy matches captured (sample, max 30): **${fuzzyMatchedSamples.length}**`);
  if (fuzzyMatchedSamples.length) {
    lines.push('');
    lines.push('| Legacy name | Resolved to | Reason |');
    lines.push('|---|---|---|');
    for (const m of fuzzyMatchedSamples) {
      lines.push(`| ${m.legacy} | ${m.matched} | ${m.reason} |`);
    }
  }
  lines.push('');
  lines.push(`- Distinct unmatched legacy names: **${unmatchedNameCounts.size}**`);
  if (unmatchedNameCounts.size) {
    const topUnmatched = [...unmatchedNameCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    lines.push('');
    lines.push(
      'Top 20 unmatched (review and add as attenders if real, or normalize the spelling):'
    );
    lines.push('');
    for (const [name, count] of topUnmatched) {
      lines.push(`- ${count}× \`${name}\``);
    }
  }
  lines.push('');

  lines.push('## Unmapped destinos (fell through to "Outras Despesas")');
  lines.push('');
  lines.push(`Distinct unmapped: **${unmappedDestinoCounts.size}**`);
  if (unmappedDestinoCounts.size) {
    const top = [...unmappedDestinoCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
    lines.push('');
    for (const [destino, count] of top) {
      lines.push(`- ${count}× \`${destino}\``);
    }
  }
  lines.push('');

  writeFileSync(path.join(FIXTURES_DIR, 'dump-report.md'), lines.join('\n'), 'utf-8');
  console.log('  wrote dump-report.md');
  console.log('Done.');
}

main();
