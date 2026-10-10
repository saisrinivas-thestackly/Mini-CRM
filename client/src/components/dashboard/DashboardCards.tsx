import clsx from 'clsx';
import { BriefcaseBusiness, CalendarClock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useModals } from '../../context/ModalsContext';
import { cityState, formatDateTime, formatMoney } from '../../lib/format';
import type { Deal } from '../../lib/types';
import { Avatar, DealThumb } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/States';

type Tone = 'teal' | 'red' | 'purple' | 'amber';

const TONES: Record<Tone, string> = {
  teal: 'from-[#5fe0c4] to-[#e9fbf6] text-[#16a88a]',
  red: 'from-[#ff9a9a] to-[#fff1f1] text-[#f05252]',
  purple: 'from-[#a5a6ff] to-[#f0f0ff] text-primary',
  amber: 'from-[#ffd48a] to-[#fff8ea] text-[#d98a00]',
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone: Tone;
  empty?: boolean;
  hint?: string;
  to?: string;
  loading?: boolean;
}

export function StatCard({ label, value, icon, tone, empty, hint, to, loading }: StatCardProps) {
  const body = (
    <div className="card flex h-full items-center justify-between gap-3 p-5 transition-colors hover:border-primary/30 sm:p-6">
      <div className="min-w-0">
        <p className="text-[17px] text-muted">{label}</p>
        {loading ? (
          <span className="skeleton mt-4 block h-10 w-20" />
        ) : (
          <p className={clsx('mt-3 truncate text-4xl font-medium tracking-tight sm:text-[44px]', empty ? 'text-muted' : 'text-navy')}>{value}</p>
        )}
        {hint && !loading && <p className="mt-1 truncate text-sm text-muted">{hint}</p>}
      </div>
      <span
        aria-hidden
        className={clsx(
          'grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-b sm:size-20 [&_svg]:size-7 [&_svg]:fill-current',
          empty ? 'from-[#c6d0db] to-white text-muted' : TONES[tone],
        )}
      >
        {icon}
      </span>
    </div>
  );
  return to ? (
    <Link to={to} className="block rounded-2xl">
      {body}
    </Link>
  ) : (
    body
  );
}

export function NextAppointmentCard({ deal, loading }: { deal?: Deal | null; loading?: boolean }) {
  const { newDeal } = useModals();
  return (
    <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-white">
      <span aria-hidden className="pointer-events-none absolute -right-24 top-44 size-80 rounded-full bg-white/10" />
      <div className="relative flex items-center justify-between">
        <h2 className="text-lg font-bold">Next Appointment</h2>
        <span className="size-2 rounded-full bg-white" aria-hidden />
      </div>

      {loading && (
        <div className="relative mt-6 space-y-4">
          <span className="block h-10 w-3/4 animate-pulse rounded bg-white/20" />
          <span className="block h-6 w-1/2 animate-pulse rounded bg-white/20" />
          <span className="block h-6 w-2/3 animate-pulse rounded bg-white/20" />
        </div>
      )}

      {!loading && !deal && (
        <div className="relative flex flex-col items-start gap-4 py-8">
          <CalendarClock className="size-9 opacity-80" strokeWidth={1.5} />
          <p className="text-white/85">No upcoming appointments.</p>
          <Button variant="secondary" onClick={() => newDeal()} className="border-0 text-navy">
            Schedule a deal
          </Button>
        </div>
      )}

      {!loading && deal && (
        <div className="relative">
          <div className="mt-6 flex items-center gap-4">
            <Avatar name={deal.customer?.name} src={deal.thumbnail || deal.customer?.avatar} size={44} className="ring-2 ring-white/40" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{deal.title}</p>
              <p className="truncate text-sm text-white/75">{cityState(deal.address) || deal.customer?.name}</p>
            </div>
          </div>
          <p className="mt-7 text-sm text-white/75">Appointment Date</p>
          <p className="mt-1 font-semibold">{formatDateTime(deal.appointmentDate)}</p>
          <div className="mt-7 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white/75">Room Area</p>
              <p className="mt-1 font-semibold">{deal.roomArea != null ? `${deal.roomArea} M²` : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-white/75">People</p>
              <p className="mt-1 font-semibold">{deal.people ?? '—'}</p>
            </div>
          </div>
          <div className="mt-7 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-white/75">Price</p>
              <p className="mt-1 font-semibold">{formatMoney(deal.value)}</p>
            </div>
            <Link
              to={`/deals/${deal.id}`}
              className="inline-flex h-12 items-center rounded-full bg-white px-7 text-[15px] font-medium text-navy transition hover:bg-white/90"
            >
              See Detail
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export function DealRow({ deal }: { deal: Deal }) {
  return (
    <li>
      <Link to={`/deals/${deal.id}`} className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-page">
        <DealThumb title={deal.title} src={deal.thumbnail} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-navy">{deal.title}</p>
          <p className="truncate text-sm text-muted">{cityState(deal.address) || deal.customer?.name}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold text-navy">{formatMoney(deal.value)}</p>
          <p className="text-sm whitespace-nowrap text-muted">
            {deal.appointmentDate
              ? new Date(deal.appointmentDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'No appointment'}
          </p>
        </div>
      </Link>
    </li>
  );
}

export function NoDeals({ className }: { className?: string }) {
  const { newDeal } = useModals();
  return (
    <EmptyState
      className={className}
      icon={<BriefcaseBusiness />}
      message="No deals in progress."
      action={
        <Button size="sm" variant="secondary" onClick={() => newDeal()}>
          Add a deal
        </Button>
      }
    />
  );
}
