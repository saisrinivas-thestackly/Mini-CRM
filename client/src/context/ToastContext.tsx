import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'saved' | 'deleted' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  saved: (message: string) => void;
  deleted: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const EMOJI: Record<ToastKind, string> = { saved: '🎉', deleted: '🔥', error: '⚠️', info: '👍' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((all) => [...all.slice(-2), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      saved: (m) => push('saved', m),
      deleted: (m) => push('deleted', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-3 px-4 md:bottom-8"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-[420px] animate-toast-in items-center gap-4 rounded-2xl bg-black py-4 pl-5 pr-4 text-white shadow-toast"
          >
            <span className="text-2xl leading-none" aria-hidden>
              {EMOJI[t.kind]}
            </span>
            <p className="flex-1 text-[17px] font-bold">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="grid size-9 place-items-center rounded-full border-2 border-white/90 text-white hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X className="size-5" strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
