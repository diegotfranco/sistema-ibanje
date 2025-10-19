import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { checkPasswordStrength } from '@/lib/zxcvbn';
import { cn } from '@/utils';

type PasswordStrengthMeterProps = {
  password: string;
  userName?: string;
  userEmail?: string;
};

type Strength = {
  score: number;
  feedback: string;
  color: keyof typeof colorMap;
  label: string;
};

const colorMap = {
  red: '[&_[data-slot=progress-indicator]]:bg-red-500',
  orange: '[&_[data-slot=progress-indicator]]:bg-orange-500',
  yellow: '[&_[data-slot=progress-indicator]]:bg-yellow-500',
  green: '[&_[data-slot=progress-indicator]]:bg-green-500',
  emerald: '[&_[data-slot=progress-indicator]]:bg-emerald-600'
} as const;

export const PasswordStrengthMeter = ({ password, userName, userEmail }: PasswordStrengthMeterProps) => {
  const [strength, setStrength] = useState<Strength | null>(null);

  useEffect(() => {
    if (!password) {
      setStrength(null);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      // Pass dynamic user inputs (like name/email) to improve accuracy
      const result = await checkPasswordStrength(password, [userName ?? '', userEmail ?? '']);
      if (cancelled) return;

      const { score, feedback } = result;

      const levels: Strength[] = [
        { score: 0, feedback: feedback.warning || 'Muito fraca', color: 'red', label: 'Muito fraca' },
        { score: 1, feedback: feedback.warning || 'Fraca', color: 'orange', label: 'Fraca' },
        { score: 2, feedback: feedback.warning || 'Razoável', color: 'yellow', label: 'Razoável' },
        { score: 3, feedback: feedback.warning || 'Forte', color: 'green', label: 'Forte' },
        { score: 4, feedback: feedback.warning || 'Excelente', color: 'emerald', label: 'Excelente' }
      ];

      setStrength(levels[score]);
    }, 250); // debounce delay

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [password, userName, userEmail]);

  if (!password || !strength) return null;

  return (
    <div className="space-y-1 mt-2">
      <Progress
        value={((strength.score + 1) / 5) * 100}
        className={cn('h-2 transition-all duration-500 ease-out bg-muted', colorMap[strength.color])}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {strength.feedback}
      </p>
    </div>
  );
};
