import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export function useUrlFilters<T extends Record<string, string>>(initial: T) {
  const [params, setParams] = useSearchParams();
  const defaultsKey = JSON.stringify(initial);
  const defaults = useMemo(() => JSON.parse(defaultsKey) as T, [defaultsKey]);

  const values = useMemo(() => {
    const out = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const v = params.get(key as string);
      if (v !== null) out[key] = v as T[keyof T];
    }
    return out;
  }, [params, defaults]);

  const page = Math.max(1, Number(params.get('page')) || 1);

  const setFilters = useCallback(
    (patch: Partial<T>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === '' || value === defaults[key]) next.delete(key);
            else next.set(key, String(value));
          }
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams, defaults],
  );

  const setPage = useCallback(
    (p: number) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (p <= 1) next.delete('page');
        else next.set('page', String(p));
        return next;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setParams],
  );

  return { values, page, setFilters, setPage };
}
