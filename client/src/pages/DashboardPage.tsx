import { AlarmClock, ArrowRight, BriefcaseBusiness, CalendarCheck, OctagonAlert, Trophy, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { DealRow, NextAppointmentCard, NoDeals, StatCard } from '../components/dashboard/DashboardCards';
import { PipelineChart } from '../components/dashboard/PipelineChart';
import { PanelTitle, RecentCustomersPanel, TasksTodoPanel } from '../components/dashboard/SidePanels';
import { ActivityLog } from '../components/deals/ActivityLog';
import { PanelLayout } from '../components/layout/AppLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { DealThumb } from '../components/ui/Avatar';
import { StagePill } from '../components/ui/Pills';
import { ErrorState, LoadingRows } from '../components/ui/States';
import { useModals } from '../context/ModalsContext';
import { useDashboard, useDeals } from '../hooks/useData';
import { formatAddress, formatMoney, formatMoneyCompact } from '../lib/format';

export function DashboardPage() {
  const { open } = useModals();
  const summary = useDashboard();
  const next = useDeals({ upcoming: 'true', sort: 'appointmentDate', limit: 1 });
  const recent = useDeals({ sort: '-createdAt', limit: 4 });
  const inProgress = useDeals({ open: 'true', sort: '-updatedAt', limit: 1 });

  const s = summary.data;
  const featured = inProgress.data?.data[0];

  return (
    <>
      <PageHeader title="Dashboard" actionLabel="Add New" onAction={() => open({ type: 'addNew' })} />
      <PanelLayout
        panel={
          <>
            <RecentCustomersPanel />
            <TasksTodoPanel />
          </>
        }
      >
        {summary.isError && (
          <div className="card mb-6">
            <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
          <div className="grid grid-cols-1 content-start gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <div className="sm:col-span-2 lg:col-span-1">
              <NextAppointmentCard deal={next.data?.data[0] ?? null} loading={next.isPending} />
            </div>
            <StatCard
              label="Customers"
              value={s?.totalCustomers ?? 0}
              empty={s?.totalCustomers === 0}
              loading={summary.isPending}
              icon={<Users />}
              tone="teal"
              to="/customers"
            />
            <StatCard
              label="Open Pipeline"
              value={formatMoneyCompact(s?.openPipelineValue ?? 0)}
              hint={s ? `${s.openDealCount} open of ${s.totalDeals} deals` : undefined}
              empty={s?.openPipelineValue === 0}
              loading={summary.isPending}
              icon={<BriefcaseBusiness />}
              tone="red"
              to="/deals?view=board"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MiniStat label="Won this month" value={s ? String(s.dealsWonThisMonth.count) : '–'} sub={s ? formatMoney(s.dealsWonThisMonth.value) : ''} icon={<Trophy />} tone="text-[#16a88a] bg-success-soft" loading={summary.isPending} to="/deals?stage=won" />
              <MiniStat label="Due today" value={s ? String(s.tasksDueToday) : '–'} sub="tasks" icon={<CalendarCheck />} tone="text-primary bg-primary-soft" loading={summary.isPending} to="/tasks?status=today" />
              <MiniStat label="Overdue" value={s ? String(s.overdueTasks) : '–'} sub="tasks" icon={s?.overdueTasks ? <OctagonAlert /> : <AlarmClock />} tone={s?.overdueTasks ? 'text-[#f05252] bg-danger-soft' : 'text-muted bg-page'} loading={summary.isPending} to="/tasks?status=overdue" />
            </div>

            <section className="card p-6">
              <PanelTitle title="Recent Deals" to="/deals" />
              {recent.isPending && <LoadingRows rows={4} />}
              {recent.isError && <ErrorState error={recent.error} onRetry={() => recent.refetch()} />}
              {recent.isSuccess && recent.data.data.length === 0 && <NoDeals className="py-8" />}
              <ul>{recent.data?.data.map((d) => <DealRow key={d.id} deal={d} />)}</ul>
            </section>

            <section className="card overflow-hidden">
              {inProgress.isPending && <div className="p-6"><LoadingRows rows={2} /></div>}
              {inProgress.isError && <ErrorState error={inProgress.error} onRetry={() => inProgress.refetch()} />}
              {inProgress.isSuccess && !featured && <NoDeals />}
              {featured && (
                <>
                  <div className="flex items-center gap-4 border-b border-line p-5 sm:px-6">
                    <DealThumb title={featured.title} src={featured.thumbnail} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-navy">{featured.title}</p>
                      <p className="truncate text-sm text-muted">{formatAddress(featured.address) || featured.customer?.name}</p>
                    </div>
                    <span className="hidden sm:block">
                      <StagePill stage={featured.stage} />
                    </span>
                    <Link to={`/deals/${featured.id}`} aria-label={`Open ${featured.title}`} className="p-2 text-primary">
                      <ArrowRight className="size-5" />
                    </Link>
                  </div>
                  <div className="px-5 py-3 sm:px-6">
                    <ActivityLog dealId={featured.id} limit={2} moreTo={`/deals/${featured.id}`} />
                  </div>
                </>
              )}
            </section>

            <section className="card p-6">
              <PanelTitle title="Pipeline by Stage" to="/deals?view=board" />
              {summary.isPending ? <span className="skeleton block h-64 w-full" /> : s && <PipelineChart data={s.pipelineByStage} />}
            </section>
          </div>
        </div>
      </PanelLayout>
    </>
  );
}

function MiniStat({ label, value, sub, icon, tone, loading, to }: { label: string; value: string; sub: string; icon: ReactNode; tone: string; loading: boolean; to: string }) {
  return (
    <Link to={to} className="card flex min-w-0 flex-col gap-3 p-4 transition-colors hover:border-primary/30">
      <span className="flex items-center justify-between gap-2">
        {loading ? (
          <span className="skeleton block h-8 w-12" />
        ) : (
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className="text-[28px] leading-none font-semibold text-navy">{value}</span>
            <span className="truncate text-xs text-muted">{sub}</span>
          </span>
        )}
        <span className={`grid size-10 shrink-0 place-items-center rounded-full [&_svg]:size-5 ${tone}`}>{icon}</span>
      </span>
      <span className="text-sm leading-snug text-muted">{label}</span>
    </Link>
  );
}
