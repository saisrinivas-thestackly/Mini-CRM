import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowRight, Users } from 'lucide-react';
import { useState } from 'react';
import { useModals } from '../../context/ModalsContext';
import { useDebounced } from '../../hooks/useDebounced';
import { customersApi } from '../../lib/services';
import type { CustomerRef } from '../../lib/types';
import { Avatar } from '../ui/Avatar';
import { CloseButton, Modal } from '../ui/Modal';
import { EmptyState, ErrorState, LoadingRows, Spinner } from '../ui/States';

interface Props {
  onSelect: (customer: CustomerRef) => void;
  onClose: () => void;
  hidden?: boolean;
}

export function SelectCustomerModal({ onSelect, onClose, hidden }: Props) {
  const { open, close } = useModals();
  const [text, setText] = useState('');
  const search = useDebounced(text.trim(), 300);

  const query = useInfiniteQuery({
    queryKey: ['customers', 'picker', search],
    queryFn: ({ pageParam }) => customersApi.list({ page: pageParam, limit: 6, search, sort: 'firstName' }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
  const customers = query.data?.pages.flatMap((p) => p.data) ?? [];

  const addNew = () =>
    open({
      type: 'customerForm',
      onSaved: (c) => {
        close();
        onSelect(c);
      },
    });

  return (
    <Modal onClose={onClose} hidden={hidden} size="md">
      <div className="flex items-center gap-4 pt-7 pb-4">
        <h2 className="flex-1 text-xl font-bold text-navy">Select Customer</h2>
        <button type="button" onClick={addNew} className="text-[17px] font-medium text-primary hover:underline">
          Add New
        </button>
        <CloseButton onClick={onClose} />
      </div>

      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search by name, email or company"
        aria-label="Search customers"
        className="field mb-2"
      />

      {query.isPending && <LoadingRows rows={4} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.isSuccess && customers.length === 0 && (
        <EmptyState
          variant="inline"
          icon={<Users />}
          message={search ? `No customers match “${search}”.` : 'No customers found.'}
          className="py-6"
        />
      )}

      <ul className="divide-y divide-transparent">
        {customers.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c)}
              className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-5 rounded-xl px-2 py-3.5 text-left transition-colors hover:bg-page"
            >
              <Avatar name={c.name} src={c.avatar} size={52} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-bold text-navy">{c.name}</span>
                <span className="block truncate text-[15px] text-muted">{c.email}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-primary" />
            </button>
          </li>
        ))}
      </ul>

      {query.hasNextPage && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="text-[17px] font-medium text-primary hover:underline disabled:opacity-60"
          >
            {query.isFetchingNextPage ? <Spinner /> : 'Load More'}
          </button>
        </div>
      )}
    </Modal>
  );
}
