import clsx from 'clsx';
import { BriefcaseBusiness, GripVertical } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import { Link } from 'react-router';
import { useMoveDeal, usePipeline } from '../../hooks/useData';
import { formatDate, formatMoney, STAGE_COLOR, STAGE_LABEL, STAGES } from '../../lib/format';
import type { Deal, DealStage } from '../../lib/types';
import { Avatar } from '../ui/Avatar';
import { EmptyState, ErrorState } from '../ui/States';

function DealCard({ deal, onMove, dragging, onDragStart, onDragEnd }: {
  deal: Deal;
  onMove: (stage: DealStage) => void;
  dragging: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={clsx('card group p-4 transition-shadow hover:shadow-md', dragging && 'opacity-40')}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 hidden size-4 shrink-0 cursor-grab text-subtle md:block" aria-hidden />
        <div className="min-w-0 flex-1">
          <Link to={`/deals/${deal.id}`} className="block truncate font-bold text-navy hover:text-primary">
            {deal.title}
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <Avatar name={deal.customer?.name} src={deal.customer?.avatar} size={24} />
            <span className="truncate text-sm text-muted">{deal.customer?.name ?? 'No customer'}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="font-semibold text-navy">{formatMoney(deal.value)}</span>
            {deal.expectedCloseDate && <span className="text-xs text-muted">Close {formatDate(deal.expectedCloseDate)}</span>}
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-muted">
            <span className="sr-only">Move {deal.title} to stage</span>
            <select
              value={deal.stage}
              onChange={(e) => onMove(e.target.value as DealStage)}
              className="h-8 w-full rounded-md border border-line bg-field px-2 text-sm text-navy outline-none focus:border-primary"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  Move to: {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </li>
  );
}

export function PipelineBoard({ search, customer }: { search: string; customer?: string }) {
  const query = usePipeline({ search: search || undefined, customer: customer || undefined });
  const move = useMoveDeal();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DealStage | null>(null);

  if (query.isPending) {
    return (
      <div className="relative flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((s) => (
          <div key={s} className="skeleton h-80 w-72 shrink-0 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const columns = query.data;
  if (columns.every((c) => c.count === 0)) {
    return <EmptyState icon={<BriefcaseBusiness />} message={search ? `No deals match “${search}”.` : 'No deals in progress.'} />;
  }

  const onDrop = (stage: DealStage) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    setOverStage(null);
    setDragId(null);
    const deal = columns.flatMap((c) => c.deals).find((d) => d.id === id);
    if (deal && deal.stage !== stage) move.mutate({ id: deal.id, stage });
  };

  return (
    <div className="relative -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
      {columns.map((col) => (
        <section
          key={col.stage}
          aria-label={`${STAGE_LABEL[col.stage]} stage`}
          onDragOver={(e) => {
            e.preventDefault();
            setOverStage(col.stage);
          }}
          onDragLeave={() => setOverStage((s) => (s === col.stage ? null : s))}
          onDrop={onDrop(col.stage)}
          className={clsx(
            'flex w-[82vw] max-w-[300px] shrink-0 snap-start flex-col rounded-2xl border bg-panel p-3 transition-colors sm:w-72',
            overStage === col.stage ? 'border-primary bg-primary-soft/60' : 'border-transparent',
          )}
        >
          <header className="mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: STAGE_COLOR[col.stage] }} aria-hidden />
              <h3 className="font-bold text-navy">{STAGE_LABEL[col.stage]}</h3>
              <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted">{col.count}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{formatMoney(col.value)}</p>
          </header>
          <ul className="flex min-h-24 flex-1 flex-col gap-3">
            {col.deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                dragging={dragId === deal.id}
                onMove={(stage) => move.mutate({ id: deal.id, stage })}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', deal.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDragId(deal.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverStage(null);
                }}
              />
            ))}
            {col.deals.length === 0 && (
              <li className="grid flex-1 place-items-center rounded-xl border-2 border-dashed border-line py-8 text-sm text-subtle">
                Drop deals here
              </li>
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
