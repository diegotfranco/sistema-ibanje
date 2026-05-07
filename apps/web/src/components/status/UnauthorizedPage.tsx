import { Lock } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { StatusPage } from './StatusPage';
import { paths } from '@/lib/paths';

export function UnauthorizedPage() {
  return (
    <StatusPage
      icon={Lock}
      title="Sem permissão"
      description="Você não tem acesso a esta página."
      actions={
        <Button asChild className="w-full">
          <Link to={paths.dashboard}>Voltar ao painel</Link>
        </Button>
      }
    />
  );
}
