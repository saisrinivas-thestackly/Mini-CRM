import clsx from 'clsx';
import { ArrowRight, ListChecks, OctagonAlert, Pencil, Users } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useModals } from '../../context/ModalsContext';
import { useCustomers, useTasks } from '../../hooks/useData';
import { formatDayMonthYear } from '../../lib/format';
import type { Task } from '../../lib/types';
import { Avatar } from '../ui/Avatar';
import { EmptyState, ErrorState, LoadingRows } from '../ui/States';

export function PanelTitle({ title, to, action }: { title: string; to?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <div className="flex items-center gap-4">
        {to && (
          <Link to={to} className="text-[15px] font-medium text-primary hover:underline">
            View All
          </Link>
        )}
        {action}
      </div>
    </div>
  );
}

export function RecentCustomersPanel() {
  const { open } = useModals();
  const query = useCustomers({ limit: 3, sort: '-createdAt' });

  return (
    <section>
      <PanelTitle title="Customers" to="/customers" />
      {query.isPending && <LoadingRows rows={3} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.isSuccess && query.data.data.length === 0 && (
        <EmptyState variant="inline" icon={<Users />} message="No customers found." />
      )}
      <ul className="space-y-1">
        {query.data?.data.map((c) => (
          <li key={c.id} className="flex items-center gap-4 py-2.5">
            <Link to={`/customers/${c.id}`} className="flex min-w-0 flex-1 items-center gap-4">
              <Avatar name={c.name} src={c.avatar} />
              <span className="min-w-0">
                <span className="block truncate font-bold text-navy">{c.name}</span>
                <span className="block truncate text-sm text-muted">{c.email}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => open({ type: 'customerForm', customer: c })}
              aria-label={`Edit ${c.name}`}
              className="rounded-full p-2 text-muted hover:bg-white hover:text-primary"
            >
              <Pencil className="size-[18px]" strokeWidth={1.6} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TaskLine({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="grid w-full grid-cols-[112px_20px_1fr] items-center gap-2 px-6 py-3.5 text-left transition-colors hover:bg-page">
        <span className={clsx('text-[15px]', task.overdue ? 'text-danger' : 'text-muted')}>{formatDayMonthYear(task.dueDate)}</span>
        <span>{task.overdue && <OctagonAlert className="size-4 fill-danger text-white" aria-label="Overdue" />}</span>
        <span className={clsx('truncate text-[15px] text-navy', task.done && 'text-muted line-through')}>{task.title}</span>
      </button>
    </li>
  );
}

export function TasksTodoPanel() {
  const { open } = useModals();
  const [title, setTitle] = useState('');
  const query = useTasks({ status: 'open', sort: 'dueDate', limit: 6 });

  const quickAdd = (e: FormEvent) => {
    e.preventDefault();
    open({ type: 'taskForm', defaults: { title: title.trim() } });
    setTitle('');
  };

  return (
    <section className="card mt-8 overflow-hidden">
      <div className="px-6 pt-6">
        <PanelTitle title="Tasks To Do" to="/tasks" />
      </div>
      {query.isPending && (
        <div className="px-6">
          <LoadingRows rows={4} avatar={false} />
        </div>
      )}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.isSuccess && query.data.data.length === 0 && (
        <EmptyState variant="inline" icon={<ListChecks />} message="No upcoming tasks found." className="px-6 pb-4" />
      )}
      <ul>
        {query.data?.data.map((t) => (
          <TaskLine key={t.id} task={t} onClick={() => open({ type: 'taskForm', task: t })} />
        ))}
      </ul>
      <form onSubmit={quickAdd} className="flex items-center border-t border-line">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add new task"
          aria-label="Add new task"
          className="h-16 flex-1 bg-transparent px-6 text-[16px] text-navy outline-none placeholder:text-muted"
        />
        <button type="submit" aria-label="Add task" className="px-6 text-primary hover:text-primary-dark">
          <ArrowRight className="size-6" />
        </button>
      </form>
    </section>
  );
}
