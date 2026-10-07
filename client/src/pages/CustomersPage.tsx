import { Pencil, UserRound, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { FilterTabs, Pagination, PillSelect, SearchInput } from '../components/ui/ListControls';
import { StatusPill } from '../components/ui/Pills';
import { EmptyState, ErrorState, LoadingRows } from '../components/ui/States';
import { useModals } from '../context/ModalsContext';
import { useCustomers } from '../hooks/useData';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { formatAddress } from '../lib/format';
import type { CustomerStatus } from '../lib/types';

const SORTS = [
  { value: '-createdAt', label: 'Date Created' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
];

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'lead', label: 'Leads' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function CustomersPage() {
  const { open } = useModals();
  const navigate = useNavigate();
  const { values, page, setFilters, setPage } = useUrlFilters({ status: '', search: '', sort: '-createdAt' });
  const query = useCustomers({ page, limit: 10, status: values.status as CustomerStatus | '', search: values.search, sort: values.sort });
  const result = query.data;
  const filtered = !!(values.status || values.search);

  return (
    <>
      <PageHeader title="Customers" actionLabel="Add New Customer" onAction={() => open({ type: 'customerForm' })} />
      <main className="p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center">
          <p className="text-lg font-bold whitespace-nowrap text-navy" aria-live="polite">
            Total: {result ? `${result.total} customer${result.total === 1 ? '' : 's'}` : '…'}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:ml-auto">
            <FilterTabs value={values.status} options={STATUS_TABS} onChange={(status) => setFilters({ status })} />
            <SearchInput value={values.search} onChange={(search) => setFilters({ search })} placeholder="Search customers" />
            <PillSelect label="Sort by" value={values.sort} options={SORTS} onChange={(sort) => setFilters({ sort })} />
          </div>
        </div>

        {query.isPending && <LoadingRows rows={8} />}
        {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
        {result && result.data.length === 0 && (
          <EmptyState
            icon={<Users />}
            message={filtered ? 'No customers match these filters.' : 'No customers found.'}
            action={
              filtered ? (
                <Button variant="secondary" onClick={() => setFilters({ status: '', search: '' })}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => open({ type: 'customerForm' })}>Add your first customer</Button>
              )
            }
          />
        )}

        {result && result.data.length > 0 && (
          <div className={query.isFetching ? 'opacity-60 transition-opacity' : undefined}>
            <table className="hidden w-full table-fixed text-left lg:table">
              <thead>
                <tr className="border-b border-line text-[15px] text-muted">
                  <th className="w-[76px] py-5 pl-5 font-normal">
                    <UserRound className="size-6 fill-muted text-muted" aria-label="Avatar" />
                  </th>
                  <th className="py-5 font-normal">Name</th>
                  <th className="py-5 font-normal">Email</th>
                  <th className="w-[150px] py-5 font-normal">Phone</th>
                  <th className="py-5 font-normal">Address</th>
                  <th className="w-[120px] py-5 font-normal">Status</th>
                  <th className="w-[70px] py-5 text-center font-normal">Edit</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-line text-[16px] text-navy transition-colors hover:bg-white"
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td className="py-5 pl-3">
                      <Avatar name={c.name} src={c.avatar} size={48} />
                    </td>
                    <td className="truncate py-5 pr-4">
                      <Link to={`/customers/${c.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary">
                        {c.name}
                      </Link>
                      {c.company && <span className="block truncate text-sm text-muted">{c.company}</span>}
                    </td>
                    <td className="truncate py-5 pr-4">{c.email}</td>
                    <td className="truncate py-5 pr-4">{c.phone || '—'}</td>
                    <td className="truncate py-5 pr-4" title={formatAddress(c.address)}>
                      {formatAddress(c.address) || '—'}
                    </td>
                    <td className="py-5">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="py-5 text-center">
                      <button
                        type="button"
                        aria-label={`Edit ${c.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          open({ type: 'customerForm', customer: c });
                        }}
                        className="rounded-full p-2 text-muted hover:bg-page hover:text-primary"
                      >
                        <Pencil className="size-5" strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="space-y-3 lg:hidden">
              {result.data.map((c) => (
                <li key={c.id} className="card flex items-center gap-4 p-4">
                  <Link to={`/customers/${c.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    <Avatar name={c.name} src={c.avatar} size={48} />
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-navy">{c.name}</span>
                      <span className="block truncate text-sm text-muted">{c.email}</span>
                      <span className="mt-1.5 block">
                        <StatusPill status={c.status} />
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`Edit ${c.name}`}
                    onClick={() => open({ type: 'customerForm', customer: c })}
                    className="rounded-full p-2 text-muted hover:text-primary"
                  >
                    <Pencil className="size-5" strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>

            <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onChange={setPage} fetching={query.isFetching} />
          </div>
        )}
      </main>
    </>
  );
}
