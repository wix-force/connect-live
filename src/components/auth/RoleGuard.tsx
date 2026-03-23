import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store';

interface RoleGuardProps {
  children: React.ReactNode;
  role: 'user' | 'admin';
}

export function RoleGuard({ children, role }: RoleGuardProps) {
  const user = useAppSelector(s => s.auth.user);

  if (!user) return <Navigate to="/login" replace />;

  if (role === 'admin' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
