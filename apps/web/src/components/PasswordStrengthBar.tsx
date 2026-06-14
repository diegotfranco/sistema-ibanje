import { Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// A presentational strength hint, not a security control. Without a real estimator (zxcvbn) this is
// a deliberately honest length-OR-variety heuristic — length and character variety are independent
// paths to a strong score, so a long passphrase is rewarded as much as a shorter mixed password. The
// server is authoritative: it enforces the 12–64 length window and the breach/common-password reject.
// Three levels map to the semantic status palette (danger / warning / success) used elsewhere in the
// app; the bar's fill is recolored from here via a child-selector variant so the shared `ui/progress`
// primitive stays untouched.
const LEVELS = [
  { label: 'Fraca', barClass: '[&>div]:bg-danger', textClass: 'text-danger' },
  { label: 'Boa', barClass: '[&>div]:bg-warning', textClass: 'text-warning-strong' },
  { label: 'Forte', barClass: '[&>div]:bg-success', textClass: 'text-success' }
] as const;

function countVariety(password: string): number {
  let variety = 0;
  if (/[a-z]/.test(password)) variety++;
  if (/[A-Z]/.test(password)) variety++;
  if (/\d/.test(password)) variety++;
  if (/[^a-zA-Z0-9]/.test(password)) variety++;
  return variety;
}

/** 0 = empty; 1 = fraca, 2 = boa, 3 = forte. */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  if (password.length < 12) return 1;
  // Length and variety are independent routes to "forte": a long passphrase OR a varied password.
  if (password.length >= 16 || countVariety(password) >= 3) return 3;
  return 2;
}

// The checklist predicates mirror the score's branches exactly, so the meter and the list can never
// disagree (e.g. "Forte" while an item still shows ✗). The first item also folds in the 64-char
// ceiling the server enforces.
function meetsLengthRange(password: string): boolean {
  return password.length >= 12 && password.length <= 64;
}
function meetsStrengthBooster(password: string): boolean {
  return password.length >= 16 || countVariety(password) >= 3;
}

// Names the single most useful next step, never a wall of rules.
function contextualTip(password: string, score: 1 | 2 | 3): string {
  if (score === 3) return 'Senha forte.';
  if (password.length < 12) return 'Adicione mais caracteres (mínimo 12).';
  return 'Use uma frase longa (16+) ou misture letras, números e símbolos.';
}

function ChecklistItem({ met, children }: { met: boolean; children: React.ReactNode }) {
  const Icon = met ? Check : X;
  return (
    <li className="flex items-center gap-1.5">
      <Icon
        size={14}
        aria-hidden
        className={cn('shrink-0', met ? 'text-success' : 'text-muted-foreground')}
      />
      <span className={cn(met ? 'text-foreground' : 'text-muted-foreground')}>{children}</span>
    </li>
  );
}

// Just the dynamic meter: the colored bar + the "Força · tip" line. Sits directly under the input
// (closest to what it measures). `score !== 0` narrows the literal union to 1|2|3 for the tip lookup.
export function PasswordStrengthMeter({ value }: { value: string }) {
  const score = passwordStrength(value);
  const filled =
    score !== 0 ? { level: LEVELS[score - 1], tip: contextualTip(value, score) } : null;

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <Progress
        value={score === 0 ? 0 : score * (100 / 3)}
        className={cn('h-1.5', filled?.level.barClass)}
        aria-label="Força da senha"
        aria-valuetext={filled?.level.label ?? 'Sem senha'}
      />
      {filled && (
        <p className="text-xs text-muted-foreground">
          Força:{' '}
          <span className={cn('font-medium', filled.level.textClass)}>{filled.level.label}</span> ·{' '}
          {filled.tip}
        </p>
      )}
    </div>
  );
}

// The static-ish requirements: the ticking checklist + the allowed-chars/breach note. Renders in
// every state (even empty) so it reads as upfront guidance, not just a reaction to typing.
export function PasswordRequirements({ value }: { value: string }) {
  return (
    <div className="space-y-1.5" aria-live="polite">
      <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
        <ChecklistItem met={meetsLengthRange(value)}>Entre 12 e 64 caracteres</ChecklistItem>
        <ChecklistItem met={meetsStrengthBooster(value)}>
          16+ caracteres, ou letras, números e símbolos
        </ChecklistItem>
      </ul>
      <p className="text-xs text-muted-foreground">
        Letras, números, símbolos e espaços são permitidos. Senhas muito comuns são bloqueadas.
      </p>
    </div>
  );
}

// Both stacked — for single-column forms (the password-reset page).
export function PasswordStrengthBar({ value }: { value: string }) {
  return (
    <div className="space-y-2">
      <PasswordStrengthMeter value={value} />
      <PasswordRequirements value={value} />
    </div>
  );
}
