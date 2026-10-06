import clsx from 'clsx';
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

export function PillSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  className?: string;
}) {
  const current = options.find((o) => o.value === value)?.label ?? options[0]?.label;
  return (
    <label
      className={clsx(
        'relative flex h-12 items-center gap-3 rounded-full border border-line bg-white pr-5 pl-6 text-[15px] text-navy transition-colors focus-within:border-primary hover:border-primary/40',
        className,
      )}
    >
      <span className="whitespace-nowrap">
        {label}: <span className="font-medium">{current}</span>
      </span>
      <ChevronDown className="ml-auto size-5 text-navy" aria-hidden />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterTabs({ value, options, onChange }: { value: string; options: Option[]; onChange: (v: string) => void }) {
  return (
    <div role="tablist" className="flex gap-0.5 overflow-x-auto rounded-full border border-line bg-white p-1 [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'h-10 flex-1 rounded-full px-1.5 text-[13px] font-medium whitespace-nowrap transition-colors min-[360px]:px-2.5 min-[360px]:text-sm sm:flex-none sm:px-4',
            value === o.value ? 'bg-primary text-white' : 'text-muted hover:text-navy',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value === '') setText('');
  }
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(onChange);

  useEffect(() => {
    latest.current = onChange;
  }, [onChange]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const type = (next: string) => {
    setText(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => latest.current(next), 350);
  };

  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={text}
        onChange={(e) => type(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full rounded-full border border-line bg-white pr-10 pl-11 text-[15px] text-navy outline-none placeholder:text-muted focus:border-primary [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            window.clearTimeout(timer.current);
            setText('');
            onChange('');
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-4 -translate-y-1/2 text-muted hover:text-navy"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onChange,
  fetching,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
  fetching?: boolean;
}) {
  if (total === 0 || totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
      <button
        type="button"
        disabled={page <= 1 || fetching}
        onClick={() => onChange(page - 1)}
        className="grid size-12 place-items-center rounded-full border border-line bg-white text-navy disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="flex h-12 min-w-[150px] items-center justify-center rounded-full border border-line bg-white px-6 text-[15px] font-medium text-navy">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages || fetching}
        onClick={() => onChange(page + 1)}
        className="grid size-12 place-items-center rounded-full border border-line bg-white text-navy disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="size-5" />
      </button>
    </nav>
  );
}
