import clsx from 'clsx';
import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { errorMessage } from '../../lib/api';
import { Button } from './Button';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" className={clsx('inline-flex items-center gap-2 text-muted', className)}>
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner className="[&_svg]:size-8" />
    </div>
  );
}

export function LoadingRows({ rows = 5, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          {avatar && <span className="skeleton size-11 shrink-0 rounded-full" />}
          <div className="flex-1 space-y-2">
            <span className="skeleton block h-4 w-2/5" />
            <span className="skeleton block h-3 w-1/4" />
          </div>
          <span className="skeleton hidden h-4 w-20 sm:block" />
        </div>
      ))}
    </div>
  );
}

interface EmptyProps {
  icon: ReactNode;
  message: string;
  action?: ReactNode;
  className?: string;
  variant?: 'inline' | 'block';
}

export function EmptyState({ icon, message, action, className, variant = 'block' }: EmptyProps) {
  if (variant === 'inline') {
    return (
      <div className={clsx('flex items-center gap-4 py-3 text-muted', className)}>
        <span className="[&_svg]:size-7 [&_svg]:stroke-[1.6]">{icon}</span>
        <p className="text-[15px]">{message}</p>
        {action}
      </div>
    );
  }
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-2 py-14 text-center text-muted', className)}>
      <span className="[&_svg]:size-10 [&_svg]:stroke-[1.6]">{icon}</span>
      <p className="text-lg">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={clsx('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-6" />
      </span>
      <div>
        <p className="font-semibold text-navy">Couldn’t load this</p>
        <p className="mt-1 text-sm text-muted">{errorMessage(error)}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={<RefreshCw className="size-4" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M9 10v4M12 8v8M15 10v4" />
    </svg>
  );
}
