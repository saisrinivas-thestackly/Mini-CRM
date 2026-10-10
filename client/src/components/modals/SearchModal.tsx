import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useDebounced } from '../../hooks/useDebounced';
import { formatMoney } from '../../lib/format';
import { customersApi, dealsApi } from '../../lib/services';
import { Avatar, DealThumb } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { ErrorState, Spinner } from '../ui/States';

export function SearchModal({ onClose, hidden }: { onClose: () => void; hidden?: boolean }) {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const term = useDebounced(text.trim(), 300);
  const enabled = term.length >= 2;

  const results = useQuery({
    queryKey: ['search', term],
    enabled,
    queryFn: async () => {
      const [customers, deals] = await Promise.all([
        customersApi.list({ search: term, limit: 5 }),
        dealsApi.list({ search: term, limit: 5 }),
      ]);
      return { customers: customers.data, deals: deals.data };
    },
  });

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const empty = results.data && results.data.customers.length === 0 && results.data.deals.length === 0;

  return (
    <Modal title="Search" onClose={onClose} hidden={hidden} size="md">
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search customers and deals…"
          className="field pl-12"
          aria-label="Search customers and deals"
        />
      </div>

      <div className="mt-4 min-h-[120px]">
        {!enabled && <p className="py-8 text-center text-sm text-muted">Type at least 2 characters.</p>}
        {enabled && results.isPending && (
          <div className="grid place-items-center py-8">
            <Spinner />
          </div>
        )}
        {enabled && results.isError && <ErrorState error={results.error} onRetry={() => results.refetch()} />}
        {enabled && empty && <p className="py-8 text-center text-muted">No matches for “{term}”.</p>}
        {enabled && results.data && !empty && (
          <div className="space-y-5">
            {results.data.customers.length > 0 && (
              <section>
                <h3 className="mb-1 text-xs font-semibold tracking-wider text-muted uppercase">Customers</h3>
                {results.data.customers.map((c) => (
                  <button key={c.id} type="button" onClick={() => go(`/customers/${c.id}`)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-page">
                    <Avatar name={c.name} src={c.avatar} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-navy">{c.name}</span>
                      <span className="block truncate text-sm text-muted">{c.email}</span>
                    </span>
                    <ArrowRight className="size-4 text-primary" />
                  </button>
                ))}
              </section>
            )}
            {results.data.deals.length > 0 && (
              <section>
                <h3 className="mb-1 text-xs font-semibold tracking-wider text-muted uppercase">Deals</h3>
                {results.data.deals.map((d) => (
                  <button key={d.id} type="button" onClick={() => go(`/deals/${d.id}`)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-page">
                    <DealThumb title={d.title} src={d.thumbnail} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-navy">{d.title}</span>
                      <span className="block truncate text-sm text-muted">{d.customer?.name}</span>
                    </span>
                    <span className="text-sm font-semibold text-navy">{formatMoney(d.value)}</span>
                  </button>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
