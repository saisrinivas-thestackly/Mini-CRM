import type { CalendarEvent } from './types';

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GRID_DAYS = 42;

const pad = (n: number) => String(n).padStart(2, '0');

export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function parseMonth(value: string, fallback: Date) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1) : new Date(fallback.getFullYear(), fallback.getMonth(), 1);
}

export function parseDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return dayKey(date) === value ? date : null;
}

export const addMonths = (month: Date, delta: number) => new Date(month.getFullYear(), month.getMonth() + delta, 1);

export function monthGrid(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());
  const days = Array.from({ length: GRID_DAYS }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + GRID_DAYS);
  return { days, from: start.toISOString(), to: end.toISOString() };
}

export function groupByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dayKey(new Date(event.date));
    const list = map.get(key);
    if (list) list.push(event);
    else map.set(key, [event]);
  }
  return map;
}

export function eventTone(event: CalendarEvent) {
  if (event.type === 'appointment') return { dot: 'bg-success', chip: 'bg-success-soft text-[#139a7f]', label: 'Appointment' };
  if (event.type === 'close') return { dot: 'bg-warning', chip: 'bg-warning-soft text-[#b7791f]', label: 'Expected close' };
  if (event.done) return { dot: 'bg-subtle', chip: 'bg-[#eef1f6] text-muted line-through', label: 'Task done' };
  if (event.overdue) return { dot: 'bg-danger', chip: 'bg-danger-soft text-[#e25555]', label: 'Overdue task' };
  return { dot: 'bg-primary', chip: 'bg-primary-soft text-primary', label: 'Task' };
}
