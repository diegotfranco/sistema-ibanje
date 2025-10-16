import { useLogout } from '@/hooks/useLogout';
import { AiOutlineMenuUnfold, AiOutlineMenuFold } from 'react-icons/ai';
import { Button } from './ui/button';
import { useSidebar } from './ui/sidebar';

const Topbar = () => {
  const { logout, isPending } = useLogout();
  const { toggleSidebar, state } = useSidebar();
  return (
    <div className="bg-teal-700 flex justify-between items-center p-2">
      <Button
        variant="ghost"
        // size="icon"
        onClick={toggleSidebar}
        className="transition-transform text-slate-100 hover:text-teal-800 cursor-pointer">
        {state === 'collapsed' ? <AiOutlineMenuUnfold /> : <AiOutlineMenuFold />}
      </Button>
      <div className="">
        <button
          onClick={logout}
          disabled={isPending}
          className="text-sm text-slate-100 hover:underline disabled:text-slate-400 cursor-pointer">
          {isPending ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </div>
  );
};

export default Topbar;
