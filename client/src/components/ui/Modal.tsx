import clsx from 'clsx';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean;
  tone?: 'white' | 'soft';
  titleClassName?: string;
}

const WIDTH = { sm: 'max-w-[360px]', md: 'max-w-[480px]', lg: 'max-w-[620px]' };

export function CloseButton({ onClick, label = 'Close' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-white transition-colors hover:bg-navy"
    >
      <X className="size-4" strokeWidth={3} />
    </button>
  );
}

interface ViewportBox {
  top: number;
  height: number;
  keyboard: boolean;
}

const KEYBOARD_MIN_HEIGHT = 120;

function useVisibleViewport(active: boolean) {
  const [box, setBox] = useState<ViewportBox | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    let frame = 0;
    const baseline = { width: vv.width, height: Math.max(vv.height, window.innerHeight) };
    const measure = () => {
      if (Math.abs(vv.scale - 1) > 0.01) return setBox(null);
      if (Math.abs(vv.width - baseline.width) > 1) {
        baseline.width = vv.width;
        baseline.height = vv.height;
      }
      baseline.height = Math.max(baseline.height, vv.height);
      const next = { top: Math.max(0, vv.offsetTop), height: vv.height, keyboard: baseline.height - vv.height > KEYBOARD_MIN_HEIGHT };
      setBox((prev) => (prev && prev.top === next.top && prev.height === next.height && prev.keyboard === next.keyboard ? prev : next));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    schedule();
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
    };
  }, [active]);

  return active ? box : null;
}

const DRAG_THRESHOLD = 6;
const NO_DRAG_SELECTOR = 'select, textarea, input[type="range"], [data-no-drag]';

function useMouseDragScroll(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = ref.current;
    if (!active || !scroller) return;
    let start: { y: number; x: number; top: number; focused: Element | null } | null = null;
    let dragging = false;

    const swallowClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onMove = (e: PointerEvent) => {
      if (!start) return;
      const dy = e.clientY - start.y;
      const dx = e.clientX - start.x;
      if (!dragging) {
        if (Math.abs(dy) < DRAG_THRESHOLD || Math.abs(dy) < Math.abs(dx)) return;
        dragging = true;
        scroller.style.userSelect = 'none';
        scroller.style.cursor = 'grabbing';
        const now = document.activeElement;
        if (now !== start.focused && now instanceof HTMLElement && scroller.contains(now)) now.blur();
        window.getSelection()?.removeAllRanges();
      }
      e.preventDefault();
      scroller.scrollTop = start.top - dy;
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      scroller.style.userSelect = '';
      scroller.style.cursor = '';
      if (dragging) {
        window.addEventListener('click', swallowClick, { capture: true, once: true });
        window.setTimeout(() => window.removeEventListener('click', swallowClick, { capture: true }), 0);
      }
      start = null;
      dragging = false;
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (scroller.scrollHeight <= scroller.clientHeight) return;
      if (e.target instanceof Element && e.target.closest(NO_DRAG_SELECTOR)) return;
      if (e.offsetX > (e.target as HTMLElement).clientWidth && e.target === scroller) return;
      start = { y: e.clientY, x: e.clientX, top: scroller.scrollTop, focused: document.activeElement };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    };

    scroller.addEventListener('pointerdown', onDown);
    return () => {
      scroller.removeEventListener('pointerdown', onDown);
      onUp();
    };
  }, [active]);

  return ref;
}

function isTextField(el: Element | null): el is HTMLElement {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
}

export function Modal({ title, onClose, children, footer, size = 'md', hidden, tone = 'white', titleClassName }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const viewport = useVisibleViewport(!hidden);
  const scrollRef = useMouseDragScroll(!hidden);
  const viewportHeight = viewport?.height;
  const keyboardOpen = viewport?.keyboard ?? false;

  useEffect(() => {
    if (!keyboardOpen) return;
    const el = document.activeElement;
    if (isTextField(el) && panelRef.current?.contains(el)) el.scrollIntoView({ block: 'center' });
  }, [keyboardOpen, viewportHeight]);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (hidden) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.activeElement as HTMLElement | null;
    const desktop = window.matchMedia?.('(pointer: fine) and (min-width: 640px)').matches ?? true;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(
      desktop ? 'input:not([type="file"]):not([type="hidden"]), textarea, select, [data-autofocus]' : '[data-autofocus]',
    );
    (first ?? panel?.querySelector<HTMLElement>('[data-modal-scroll]') ?? panel)?.focus({ preventScroll: true });
    const root = document.documentElement;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = root.style.overflow;
    document.body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = bodyOverflow;
      root.style.overflow = rootOverflow;
      previous?.focus?.();
    };
  }, [hidden]);

  return createPortal(
    <div
      className={clsx('fixed inset-x-0 top-0 z-50 flex h-dvh items-end justify-center bg-black/50 sm:items-center sm:p-6', hidden && 'hidden')}
      style={viewport ? { top: viewport.top, height: viewport.height } : undefined}
      data-keyboard={keyboardOpen || undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={clsx(
          'flex w-full animate-pop-in flex-col overflow-hidden rounded-t-3xl shadow-pop outline-none sm:max-h-full sm:rounded-2xl',
          WIDTH[size],
          tone === 'soft' ? 'bg-page [--modal-bg:var(--color-page)]' : 'bg-white [--modal-bg:#ffffff]',
          keyboardOpen ? 'max-sm:max-h-full' : 'max-sm:max-h-[94%]',
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-2 sm:px-8 sm:pt-7">
            <h2 id={titleId} className={clsx('text-xl font-bold text-navy', titleClassName)}>
              {title}
            </h2>
            <CloseButton onClick={onClose} />
          </div>
        )}
        <div ref={scrollRef} tabIndex={-1} data-modal-scroll className="min-h-0 flex-1 outline-none overflow-y-auto overscroll-contain bg-inherit px-6 pb-6 sm:px-8">{children}</div>
        {footer && <div className="border-t border-line/0 px-6 pt-2 pb-6 sm:px-8 sm:pb-7">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
