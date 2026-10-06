import clsx from 'clsx';
import { PRIORITY_LABEL, STAGE_LABEL, STATUS_LABEL } from '../../lib/format';
import type { CustomerStatus, DealStage, TaskPriority } from '../../lib/types';

const base = 'inline-flex h-8 items-center justify-center rounded-full px-4 text-xs font-semibold tracking-wide uppercase whitespace-nowrap';

const STAGE_STYLE: Record<DealStage, string> = {
  lead: 'bg-[#eef1f6] text-[#5b6b82]',
  qualified: 'bg-primary-soft text-primary',
  proposal: 'bg-primary-soft text-primary',
  won: 'bg-success-soft text-[#139a7f]',
  lost: 'bg-danger-soft text-[#e25555]',
};

export function StagePill({ stage, className }: { stage: DealStage; className?: string }) {
  return <span className={clsx(base, 'min-w-[110px]', STAGE_STYLE[stage], className)}>{STAGE_LABEL[stage]}</span>;
}

const STATUS_STYLE: Record<CustomerStatus, string> = {
  lead: 'bg-warning-soft text-[#b7791f]',
  active: 'bg-success-soft text-[#139a7f]',
  inactive: 'bg-[#eef1f6] text-[#5b6b82]',
};

export function StatusPill({ status, className }: { status: CustomerStatus; className?: string }) {
  return <span className={clsx(base, 'h-7 px-3', STATUS_STYLE[status], className)}>{STATUS_LABEL[status]}</span>;
}

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: 'text-muted bg-[#eef1f6]',
  medium: 'text-[#b7791f] bg-warning-soft',
  high: 'text-[#e25555] bg-danger-soft',
};

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  return <span className={clsx(base, 'h-6 px-2.5 text-[11px]', PRIORITY_STYLE[priority])}>{PRIORITY_LABEL[priority]}</span>;
}
