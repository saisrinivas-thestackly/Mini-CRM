import clsx from 'clsx';
import { BriefcaseBusiness, Columns3, ImageIcon, List, Pencil, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { PipelineBoard } from '../components/deals/PipelineBoard';
import { PageHeader } from '../components/layout/PageHeader';
import { DealThumb } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Pagination, PillSelect, SearchInput } from '../components/ui/ListControls';
import { StagePill } from '../components/ui/Pills';
import { EmptyState, ErrorState, LoadingRows } from '../components/ui/States';
import { useModals } from '../context/ModalsContext';
import { useCustomer, useDeals } from '../hooks/useData';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { formatAddress, formatDateTime, formatMoney, STAGE_LABEL, STAGES } from '../lib/format';
import type { Deal, DealStage } from '../lib/types';

const SORTS = [
  { value: '-createdAt', label: 'Date Created' },
  { value: 'appointmentDate', label: 'Appointment' },
  { value: '-value', label: 'Highest Price' },
  { value: 'value', label: 'Lowest Price' },
  { value: 'expectedCloseDate', label: 'Close Date' },
];

const STAGE_OPTIONS = [{ value: '', label: 'All' }, ...STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))];

function ViewToggle({ view, onChange }: { view: string; onChange: (v: string) => void }) {
  const btn = (value: string, label: string, icon: ReactNode) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={view === value}
      className={clsx(
        'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors',
        view === value ? 'bg-primary text-white' : 'text-muted hover:text-navy',
      )}
    >
      {icon}
      {label}
    </button>
  );
  return (
    <div className="flex rounded-full border border-line bg-white p-1" role="group" aria-label="View">
      {btn('list', 'List', <List className="size-4" />)}
      {btn('board', 'Pipeline', <Columns3 className="size-4" />)}
    </div>
  );
}

function DealsTable({ deals, onEdit }: { deals: Deal[]; onEdit: (d: Deal) => void }) {
  const navigate = useNavigate();
  return (
    <>
      <table className="hidden w-full table-fixed text-left lg:table">
        <thead>
          <tr className="border-b border-line text-[15px] text-muted">
            <th className="w-[76px] py-5 pl-5 font-normal">
              <ImageIcon className="size-6" aria-label="Image" />
            </th>
            <th className="py-5 font-normal">Name</th>
            <th className="w-[100px] py-5 font-normal">Area</th>
            <th className="w-[210px] py-5 font-normal">Appointment Date</th>
            <th className="w-[120px] py-5 font-normal">Price</th>
            <th className="w-[150px] py-5 font-normal">Status</th>
            <th className="w-[70px] py-5 text-center font-normal">Edit</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => (
            <tr key={d.id} onClick={() => navigate(`/deals/${d.id}`)} className="cursor-pointer border-b border-line text-[16px] text-navy transition-colors hover:bg-white">
              <td className="py-5 pl-3">
                <DealThumb title={d.title} src={d.thumbnail} size={48} />
              </td>
              <td className="py-5 pr-4">
                <Link to={`/deals/${d.id}`} onClick={(e) => e.stopPropagation()} className="block truncate hover:text-primary">
                  {d.title}
                </Link>
                <span className="block truncate text-sm text-muted">
                  {[d.customer?.name, formatAddress(d.address)].filter(Boolean).join(' · ')}
                </span>
              </td>
              <td className="py-5">{d.roomArea != null ? `${d.roomArea}M²` : '—'}</td>
              <td className="py-5">{formatDateTime(d.appointmentDate)}</td>
              <td className="py-5">{formatMoney(d.value)}</td>
              <td className="py-5">
                <StagePill stage={d.stage} />
              </td>
              <td className="py-5 text-center">
                <button
                  type="button"
                  aria-label={`Edit ${d.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(d);
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
        {deals.map((d) => (
          <li key={d.id} className="card p-4">
            <Link to={`/deals/${d.id}`} className="flex items-center gap-4">
              <DealThumb title={d.title} src={d.thumbnail} size={48} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-navy">{d.title}</span>
                <span className="block truncate text-sm text-muted">{d.customer?.name}</span>
              </span>
              <span className="font-semibold text-navy">{formatMoney(d.value)}</span>
            </Link>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted">{formatDateTime(d.appointmentDate)}</span>
              <StagePill stage={d.stage} className="h-7 min-w-0" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function DealsPage() {
  const { open, newDeal } = useModals();
  const { values, page, setFilters, setPage } = useUrlFilters({ view: 'list', stage: '', search: '', sort: '-createdAt', customer: '' });
  const isBoard = values.view === 'board';
  const query = useDeals(
    { page, limit: 10, stage: values.stage as DealStage | '', search: values.search, sort: values.sort, customer: values.customer || undefined },
    !isBoard,
  );
  const customer = useCustomer(values.customer || undefined);
  const result = query.data;
  const filtered = !!(values.stage || values.search || values.customer);

  return (
    <>
      <PageHeader title="Deals" actionLabel="Add New Deal" onAction={() => newDeal(customer.data?.customer ?? null)} />
      <main className="p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-3">
            {!isBoard && (
              <p className="text-lg font-bold whitespace-nowrap text-navy" aria-live="polite">
                Total: {result ? `${result.total} deal${result.total === 1 ? '' : 's'}` : '…'}
              </p>
            )}
            {values.customer && (
              <span className="inline-flex h-9 items-center gap-2 rounded-full bg-primary-soft pr-2 pl-4 text-sm font-medium text-primary">
                Customer: {customer.data?.customer.name ?? '…'}
                <button type="button" aria-label="Clear customer filter" onClick={() => setFilters({ customer: '' })} className="rounded-full p-1 hover:bg-white">
                  <X className="size-3.5" />
                </button>
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:ml-auto">
            <ViewToggle view={values.view} onChange={(view) => setFilters({ view })} />
            <SearchInput value={values.search} onChange={(search) => setFilters({ search })} placeholder="Search deals" />
            {!isBoard && (
              <>
                <PillSelect label="Stage" value={values.stage} options={STAGE_OPTIONS} onChange={(stage) => setFilters({ stage })} />
                <PillSelect label="Sort by" value={values.sort} options={SORTS} onChange={(sort) => setFilters({ sort })} />
              </>
            )}
          </div>
        </div>

        {isBoard ? (
          <PipelineBoard search={values.search} customer={values.customer} />
        ) : (
          <>
            {query.isPending && <LoadingRows rows={8} />}
            {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
            {result && result.data.length === 0 && (
              <EmptyState
                icon={<BriefcaseBusiness />}
                message={filtered ? 'No deals match these filters.' : 'No deals in progress.'}
                action={
                  filtered ? (
                    <Button variant="secondary" onClick={() => setFilters({ stage: '', search: '', customer: '' })}>
                      Clear filters
                    </Button>
                  ) : (
                    <Button onClick={() => newDeal()}>Add your first deal</Button>
                  )
                }
              />
            )}
            {result && result.data.length > 0 && (
              <div className={query.isFetching ? 'opacity-60 transition-opacity' : undefined}>
                <DealsTable deals={result.data} onEdit={(deal) => open({ type: 'dealForm', deal })} />
                <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onChange={setPage} fetching={query.isFetching} />
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
