import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { PageLoader } from '../ui/States';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const { user, checking, sessionError, retrySession } = useAuth();
  const location = useLocation();

  if (checking) return <PageLoader />;

  if (sessionError && !user) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-navy">We couldn’t reach the server.</p>
          <p className="mt-1 text-muted">{sessionError.message}</p>
          <Button className="mt-5" onClick={retrySession}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pb-20 md:pb-0 md:pl-[90px]">
        <Outlet />
      </div>
    </div>
  );
}

export function PanelLayout({ children, panel }: { children: ReactNode; panel: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-90px)] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 p-4 sm:p-6">{children}</div>
      <aside className="min-w-0 border-t border-line bg-panel p-4 sm:p-6 xl:border-t-0 xl:border-l">{panel}</aside>
    </div>
  );
}
