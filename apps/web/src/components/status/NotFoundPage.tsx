import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { StatusPage } from './StatusPage';
import { paths } from '@/lib/paths';

export function NotFoundPage() {
  return (
    <StatusPage
      icon={FileQuestion}
      title="Página não encontrada"
      description="A página que você procura não existe ou foi removida."
      actions={
        <Button asChild className="w-full">
          <Link to={paths.dashboard}>Voltar ao painel</Link>
        </Button>
      }
    />
  );
}
