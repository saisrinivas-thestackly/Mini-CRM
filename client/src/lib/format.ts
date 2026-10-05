import type { Address, CustomerStatus, DealStage, RoomAccess, TaskPriority } from './types';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatMoney = (value: number) => currency.format(value || 0);
export const formatMoneyCompact = (value: number) => compactCurrency.format(value || 0);

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

export const formatDate = (value?: string | null) =>
  value ? toDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDayMonthYear = (value?: string | null) => {
  if (!value) return '—';
  const d = toDate(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDateTime = (value?: string | null) =>
  value
    ? toDate(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const formatShortDateTime = (value?: string | null) =>
  value
    ? toDate(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

export const formatTimeDate = (value?: string | null) => {
  if (!value) return '—';
  const d = toDate(value);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  return `${time} ${formatDayMonthYear(value)}`;
};

export function toDateTimeInput(value?: string | Date | null) {
  if (!value) return '';
  const d = toDate(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toDateInput(value?: string | null) {
  return value ? toDateTimeInput(value).slice(0, 10) : '';
}

export const fromInput = (value: string) => (value ? new Date(value).toISOString() : null);

export function formatAddress(address?: Partial<Address> | null, { withZip = true } = {}) {
  if (!address) return '';
  const stateZip = [address.state, withZip ? address.zip : ''].filter(Boolean).join(' ');
  return [address.street, address.city, stateZip].filter(Boolean).join(', ');
}

export function cityState(address?: Partial<Address> | null) {
  return [address?.city, address?.state].filter(Boolean).join(', ');
}

export const STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'won', 'lost'];

export const STAGE_LABEL: Record<DealStage, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

export const STAGE_COLOR: Record<DealStage, string> = {
  lead: '#a3b0c2',
  qualified: '#7c7dfb',
  proposal: '#5051f9',
  won: '#2dc8a8',
  lost: '#ff7a7a',
};

export const CUSTOMER_STATUSES: CustomerStatus[] = ['lead', 'active', 'inactive'];
export const STATUS_LABEL: Record<CustomerStatus, string> = { lead: 'Lead', active: 'Active', inactive: 'Inactive' };

export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
export const PRIORITY_LABEL: Record<TaskPriority, string> = { low: 'Low', medium: 'Medium', high: 'High' };

export const ROOM_ACCESS_LABEL: Record<RoomAccess, string> = {
  keys_with_doorman: 'Keys with doorman',
  keys_in_lockbox: 'Keys in lockbox',
  customer_present: 'Customer will be present',
  other: 'Other',
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
