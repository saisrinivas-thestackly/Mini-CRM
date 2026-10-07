import { LogOut, Plus, Search, Settings } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useModals } from '../../context/ModalsContext';
import { Avatar } from '../ui/Avatar';
import { Button, IconButton } from '../ui/Button';

interface PageHeaderProps {
  title: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  back?: ReactNode;
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="rounded-full ring-offset-2 transition hover:ring-2 hover:ring-primary/30"
      >
        <Avatar name={user?.name} size={48} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-60 animate-pop-in rounded-2xl border border-line bg-white p-2 shadow-pop">
          <div className="px-3 py-2">
            <p className="truncate font-semibold text-navy">{user?.name}</p>
            <p className="truncate text-sm text-muted">{user?.email}</p>
          </div>
          <Link role="menuitem" to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-navy hover:bg-page">
            <Settings className="size-4" /> Settings
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              setOpen(false);
              await logout();
              navigate('/login', { replace: true });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-danger hover:bg-danger-soft"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, actionLabel, onAction, back }: PageHeaderProps) {
  const { open } = useModals();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page/95 backdrop-blur">
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 md:h-[90px] lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {back}
          <h1 className="truncate text-xl font-bold text-navy md:text-[28px]">{title}</h1>
        </div>
        {actionLabel && onAction && (
          <>
            <span className="hidden sm:block">
              <Button onClick={onAction} size="lg" className="h-[52px] px-7" iconRight={<Plus className="size-5" />}>
                {actionLabel}
              </Button>
            </span>
            <IconButton label={actionLabel} tone="primary" className="size-11 sm:hidden" onClick={onAction}>
              <Plus className="size-5" />
            </IconButton>
          </>
        )}
        <IconButton label="Search" className="size-11 md:size-12" onClick={() => open({ type: 'search' })}>
          <Search className="size-5" />
        </IconButton>
        <UserMenu />
      </div>
    </header>
  );
}
