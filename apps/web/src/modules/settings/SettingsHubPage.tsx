import { NavLink } from 'react-router';
import {
  Building2,
  CreditCard,
  FileCode2,
  ShieldAlert,
  Users,
  type LucideIcon
} from 'lucide-react';
import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent } from '@/components/Card';
import { paths } from '@/lib/paths';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';

type HubLink = {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  module: Module;
};

type HubGroup = { heading: string; links: HubLink[] };

// Card grid landing for the Configurações section. Each card links to an existing
// settings page; cards are gated by the same permission that gates the page itself,
// so a user only sees what they can actually reach.
const GROUPS: HubGroup[] = [
  {
    heading: 'Igreja',
    links: [
      {
        label: 'Configurações da Igreja',
        description: 'Identificação, contato, diretoria e logotipo.',
        to: paths.churchSettings,
        icon: Building2,
        module: Module.ChurchSettings
      }
    ]
  },
  {
    heading: 'Acesso & Permissões',
    links: [
      {
        label: 'Usuários',
        description: 'Contas de acesso, aprovação e permissões.',
        to: paths.users,
        icon: Users,
        module: Module.Users
      },
      {
        label: 'Cargos',
        description: 'Cargos e seus modelos de permissão.',
        to: paths.roles,
        icon: ShieldAlert,
        module: Module.Roles
      }
    ]
  },
  {
    heading: 'Financeiro',
    links: [
      {
        label: 'Formas de Pagamento',
        description: 'Métodos aceitos em entradas e saídas.',
        to: paths.paymentMethods,
        icon: CreditCard,
        module: Module.PaymentMethods
      }
    ]
  },
  {
    heading: 'Secretaria',
    links: [
      {
        label: 'Modelos de Ata',
        description: 'Modelos reutilizáveis para atas de reunião.',
        to: paths.minuteTemplates,
        icon: FileCode2,
        module: Module.MinuteTemplates
      }
    ]
  }
];

export default function SettingsHubPage() {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;

  const visibleGroups = GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => hasPermission(perms, link.module, Action.View))
  })).filter((group) => group.links.length > 0);

  return (
    <PageContainer>
      {visibleGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Você não tem acesso a nenhuma área de configuração.
        </p>
      ) : (
        visibleGroups.map((group) => (
          <section key={group.heading} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{group.heading}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="group block rounded-xl focus-visible:outline-none">
                    <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-muted/30 group-focus-visible:ring-2 group-focus-visible:ring-ring/50">
                      <CardContent className="flex items-start gap-3 py-5">
                        <span className="rounded-lg bg-primary/10 p-2 text-primary">
                          <Icon size={20} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">{link.label}</p>
                          <p className="text-sm text-muted-foreground">{link.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </NavLink>
                );
              })}
            </div>
          </section>
        ))
      )}
    </PageContainer>
  );
}
