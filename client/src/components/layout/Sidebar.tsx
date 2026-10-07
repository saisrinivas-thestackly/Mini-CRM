import clsx from 'clsx';
import { Bell, BriefcaseBusiness, CalendarDays, LayoutGrid, ListChecks, Settings, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useDashboard } from '../../hooks/useData';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
  alerts?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutGrid />, end: true },
  { to: '/deals', label: 'Deals', icon: <BriefcaseBusiness /> },
  { to: '/customers', label: 'Customers', icon: <Users /> },
  { to: '/tasks', label: 'Tasks', icon: <ListChecks /> },
  { to: '/calendar', label: 'Calendar', icon: <CalendarDays /> },
  { to: '/notifications', label: 'Notifications', icon: <Bell />, alerts: true },
  { to: '/settings', label: 'Settings', icon: <Settings /> },
];

const itemClass = (active: boolean) =>
  clsx(
    'relative grid size-[50px] place-items-center rounded-full transition-colors [&_svg]:size-5 [&_svg]:stroke-[1.6]',
    active ? 'bg-primary text-white' : 'border border-line bg-white text-muted hover:border-primary/40 hover:text-primary',
  );

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx('grid size-[46px] place-items-center rounded-md bg-navy', className)} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-6 text-white" fill="none">
        <path d="M12 3a9 9 0 1 0 0 18V3z" fill="currentColor" />
        <path d="M13.5 5v14M13.5 9h3.5M13.5 12.5h4.5M13.5 16h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Sidebar() {
  const summary = useDashboard();
  const alertCount = (summary.data?.overdueTasks ?? 0) + (summary.data?.tasksDueToday ?? 0);

  const render = (item: NavItem, mobile = false) => {
    const showDot = item.alerts && alertCount > 0;
    const label = showDot ? `${item.label} (${alertCount} need attention)` : item.label;
    return (
      <NavLink
        key={item.label}
        to={item.to}
        end={item.end}
        aria-label={label}
        title={item.label}
        className={({ isActive }) => (mobile ? clsx(itemClass(isActive), 'size-10 border-0') : itemClass(isActive))}
      >
        {({ isActive }) => (
          <>
            {item.icon}
            {showDot && (
              <span
                className={clsx(
                  'absolute size-2 rounded-full ring-2',
                  mobile ? 'top-2 right-2' : 'top-3 right-3.5',
                  isActive ? 'bg-white ring-primary' : 'bg-danger ring-white',
                )}
              />
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[90px] flex-col items-center border-r border-line bg-page md:flex">
        <div className="flex h-[90px] w-full items-center justify-center border-b border-line">
          <Logo />
        </div>
        <nav aria-label="Main" className="flex flex-col items-center gap-4 pt-5">
          {NAV.map((item) => render(item))}
        </nav>
      </aside>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-white/95 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        {NAV.map((item) => render(item, true))}
      </nav>
    </>
  );
}
