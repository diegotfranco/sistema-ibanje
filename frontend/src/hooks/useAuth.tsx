import { AuthContext } from '@/contexts/authContext';
import { useContext } from 'react';
import type { AuthContextType } from '@/types/auth.types';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');

  return context;
};
