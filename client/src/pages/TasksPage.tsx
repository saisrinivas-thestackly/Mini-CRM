import clsx from 'clsx';
import { Check, ListChecks, OctagonAlert, Pencil, X } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { FilterTabs, Pagination, PillSelect, SearchInput } from '../components/ui/ListControls';
import { PriorityPill } from '../components/ui/Pills';
import { EmptyState, ErrorState, LoadingRows } from '../components/ui/States';
import { useModals } from '../context/ModalsContext';
import { useCustomer, useTasks, useToggleTask } from '../hooks/useData';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { formatDayMonthYear, PRIORITIES, PRIORITY_LABEL } from '../lib/format';
import type { Task } from '../lib/types';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'open', label: 'Open' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'done', label: 'Done' },
];
const SORTS = [
  { value: 'dueDate', label: 'Due Date' },
  { value: '-dueDate', label: 'Latest Due' },
  { value: '-createdAt', label: 'Date Created' },
];
const PRIORITY_OPTIONS = [{ value: '', label: 'Any' }, ...PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))];

function TaskCheck({ task }: { task: Task }) {
  const toggle = useToggleTask();
  const label = task.done ? `Mark “${task.title}” as not done` : `Mark “${task.title}” as done`;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={task.done}
      aria-label={label}
      disabled={toggle.isPending}
      onClick={(e) => {
        e.stopPropagation();
        toggle.mutate({ id: task.id, done: !task.done });
      }}
      className={clsx(
        'grid size-7 shrink-0 place-items-center rounded-md border-2 transition-colors disabled:opacity-50',
        task.done && 'border-success bg-success text-white',
        !task.done && task.overdue && 'border-transparent text-danger',
        !task.done && !task.overdue && 'border-line bg-white hover:border-primary',
      )}
    >
      {task.done && <Check className="size-4" strokeWidth={3} />}
      {!task.done && task.overdue && <OctagonAlert className="size-7 fill-danger text-white" aria-hidden />}
    </button>
  );
}

function Links({ task }: { task: Task }) {
  if (!task.customer && !task.deal) return null;
  return (
    <span className="mt-0.5 block truncate text-sm text-muted">
      {task.customer && (
        <Link to={`/customers/${task.customer.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary">
          {task.customer.name}
        </Link>
      )}
      {task.customer && task.deal && ' · '}
      {task.deal && (
        <Link to={`/deals/${task.deal.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary">
          {task.deal.title}
        </Link>
      )}
    </span>
  );
}

export function TasksPage() {
  const { open } = useModals();
  const { values, page, setFilters, setPage } = useUrlFilters({ status: '', priority: '', search: '', sort: 'dueDate', customer: '' });
  const query = useTasks({ page, limit: 10, ...values, customer: values.customer || undefined });
  const customer = useCustomer(values.customer || undefined);
  const result = query.data;
  const filtered = !!(values.status || values.priority || values.search || values.customer);
  const add = () => open({ type: 'taskForm', defaults: values.customer ? { customer: values.customer } : undefined });
  const edit = (task: Task) => open({ type: 'taskForm', task });

  return (
    <>
      <PageHeader title="Tasks" actionLabel="Add New Task" onAction={add} />
      <main className="p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-bold whitespace-nowrap text-navy" aria-live="polite">
              Total: {result ? `${result.total} task${result.total === 1 ? '' : 's'}` : '…'}
            </p>
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
            <FilterTabs value={values.status} options={STATUS_TABS} onChange={(status) => setFilters({ status })} />
            <SearchInput value={values.search} onChange={(search) => setFilters({ search })} placeholder="Search tasks" />
            <PillSelect label="Priority" value={values.priority} options={PRIORITY_OPTIONS} onChange={(priority) => setFilters({ priority })} />
            <PillSelect label="Sort by" value={values.sort} options={SORTS} onChange={(sort) => setFilters({ sort })} />
          </div>
        </div>

        {query.isPending && <LoadingRows rows={8} avatar={false} />}
        {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
        {result && result.data.length === 0 && (
          <EmptyState
            icon={<ListChecks />}
            message={filtered ? 'No tasks match these filters.' : 'No tasks yet.'}
            action={
              filtered ? (
                <Button variant="secondary" onClick={() => setFilters({ status: '', priority: '', search: '', customer: '' })}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={add}>Add a task</Button>
              )
            }
          />
        )}

        {result && result.data.length > 0 && (
          <div className={query.isFetching ? 'opacity-60 transition-opacity' : undefined}>
            <div className="hidden grid-cols-[48px_170px_1fr_110px_60px] items-center border-b border-line py-5 pl-5 text-[15px] text-muted md:grid">
              <span className="grid size-6 place-items-center rounded bg-muted text-white" aria-hidden>
                <Check className="size-4" strokeWidth={3} />
              </span>
              <span>Due Date</span>
              <span>Task</span>
              <span>Priority</span>
              <span className="text-center">Edit</span>
            </div>
            <ul>
              {result.data.map((t) => (
                <li
                  key={t.id}
                  onClick={() => edit(t)}
                  className="grid cursor-pointer grid-cols-[40px_1fr_auto] items-center gap-y-1 border-b border-line py-4 pl-2 text-[16px] transition-colors hover:bg-white md:grid-cols-[48px_170px_1fr_110px_60px] md:py-5 md:pl-5"
                >
                  <TaskCheck task={t} />
                  <span className={clsx('order-3 col-start-2 text-sm md:order-none md:col-start-auto md:text-[16px]', t.overdue ? 'text-danger' : 'text-navy')}>
                    {formatDayMonthYear(t.dueDate)}
                    {t.overdue && <span className="ml-2 text-xs font-semibold tracking-wide uppercase md:mt-0.5 md:ml-0 md:block">Overdue</span>}
                  </span>
                  <span className="order-2 min-w-0 pr-3 md:order-none md:pl-4">
                    <span className={clsx('block truncate', t.done ? 'text-muted line-through' : 'text-navy')}>{t.title}</span>
                    <Links task={t} />
                  </span>
                  <span className="order-4 hidden md:order-none md:block">
                    <PriorityPill priority={t.priority} />
                  </span>
                  <span className="order-2 row-span-2 text-center md:order-none md:row-span-1">
                    <button
                      type="button"
                      aria-label={`Edit ${t.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        edit(t);
                      }}
                      className="rounded-full p-2 text-muted hover:bg-page hover:text-primary"
                    >
                      <Pencil className="size-5" strokeWidth={1.5} />
                    </button>
                  </span>
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
