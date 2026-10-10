import { BellRing, CalendarCheck, CalendarClock, OctagonAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { DealRow } from '../components/dashboard/DashboardCards';
import { PanelTitle, TaskLine } from '../components/dashboard/SidePanels';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState, ErrorState, LoadingRows } from '../components/ui/States';
import { useModals } from '../context/ModalsContext';
import { useDeals, useTasks } from '../hooks/useData';
import type { Paginated } from '../lib/types';

interface SectionQuery<T> {
  data?: Paginated<T>;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

interface SectionProps<T> {
  title: string;
  to: string;
  icon: ReactNode;
  empty: string;
  query: SectionQuery<T>;
  flush?: boolean;
  children: (items: T[]) => ReactNode;
}

function Section<T>({ title, to, icon, empty, query, flush, children }: SectionProps<T>) {
  const items = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  return (
    <section className="card overflow-hidden">
      <div className="px-6 pt-6">
        <PanelTitle title={query.data ? `${title} (${total})` : title} to={to} />
      </div>
      {query.isPending && (
        <div className="px-6 pb-2">
          <LoadingRows rows={2} avatar={false} />
        </div>
      )}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.data && items.length === 0 && <EmptyState variant="inline" icon={icon} message={empty} className="px-6 pb-5" />}
      {items.length > 0 && <ul className={flush ? 'pb-2' : 'px-6 pb-3'}>{children(items)}</ul>}
      {total > items.length && <p className="border-t border-line px-6 py-3 text-sm text-muted">Showing {items.length} of {total}.</p>}
    </section>
  );
}

export function NotificationsPage() {
  const { open } = useModals();
  const overdue = useTasks({ status: 'overdue', sort: 'dueDate', limit: 10 });
  const today = useTasks({ status: 'today', sort: 'dueDate', limit: 10 });
  const appointments = useDeals({ upcoming: 'true', sort: 'appointmentDate', limit: 5 });

  const loaded = overdue.data && today.data && appointments.data;
  const count = (overdue.data?.total ?? 0) + (today.data?.total ?? 0);

  return (
    <>
      <PageHeader title="Notifications" />
      <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        <div className="card flex items-center gap-4 p-5 sm:p-6" aria-live="polite">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <BellRing className="size-6" strokeWidth={1.6} />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-navy">
              {!loaded ? 'Checking what needs your attention…' : count === 0 ? 'You’re all caught up.' : `${count} task${count === 1 ? '' : 's'} need${count === 1 ? 's' : ''} your attention`}
            </p>
            <p className="mt-0.5 text-sm text-muted">Overdue and due-today tasks, plus your next appointments.</p>
          </div>
        </div>

        <Section title="Overdue tasks" to="/tasks?status=overdue" icon={<OctagonAlert />} empty="Nothing is overdue." query={overdue} flush>
          {(tasks) => tasks.map((t) => <TaskLine key={t.id} task={t} onClick={() => open({ type: 'taskForm', task: t })} />)}
        </Section>

        <Section title="Due today" to="/tasks?status=today" icon={<CalendarCheck />} empty="No tasks due today." query={today} flush>
          {(tasks) => tasks.map((t) => <TaskLine key={t.id} task={t} onClick={() => open({ type: 'taskForm', task: t })} />)}
        </Section>

        <Section title="Upcoming appointments" to="/calendar" icon={<CalendarClock />} empty="No upcoming appointments." query={appointments}>
          {(deals) => deals.map((d) => <DealRow key={d.id} deal={d} />)}
        </Section>
      </main>
    </>
  );
}
