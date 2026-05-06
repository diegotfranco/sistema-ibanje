import { useCurrentUser } from '@/modules/auth/useCurrentUser';

export default function DashboardPage() {
  const { data: user } = useCurrentUser();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-800">Painel</h1>
      {user && <p className="mt-2 text-slate-500">Bem-vindo, {user.name}.</p>}
    </div>
  );
}
