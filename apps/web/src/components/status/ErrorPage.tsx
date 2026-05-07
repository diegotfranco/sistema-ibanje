import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { StatusPage } from './StatusPage';
import { paths } from '@/lib/paths';

export function ErrorPage({ error, resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    resetErrorBoundary();
    navigate(paths.dashboard);
  };

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  return (
    <StatusPage
      icon={AlertTriangle}
      title="Algo deu errado"
      description={
        <div>
          <p>Um erro inesperado ocorreu nesta página.</p>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer">Detalhes técnicos</summary>
            <pre className="mt-2 whitespace-pre-wrap wrap-break-word text-left">{errorMessage}</pre>
          </details>
        </div>
      }
      actions={
        <div className="flex gap-3 w-full flex-col sm:flex-row">
          <Button onClick={resetErrorBoundary} className="flex-1">
            Tentar novamente
          </Button>
          <Button variant="outline" onClick={handleDashboardClick} className="flex-1">
            Voltar ao painel
          </Button>
        </div>
      }
    />
  );
}
