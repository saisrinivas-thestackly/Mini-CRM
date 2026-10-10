import clsx from 'clsx';
import { dayKey, eventTone, WEEKDAYS } from '../../lib/calendar';
import type { CalendarEvent } from '../../lib/types';

interface Props {
  days: Date[];
  month: Date;
  selected: string;
  eventsByDay: Map<string, CalendarEvent[]>;
  onSelect: (day: string) => void;
}

const MAX_CHIPS = 2;
const MAX_DOTS = 4;

export function MonthGrid({ days, month, selected, eventsByDay, onSelect }: Props) {
  const today = dayKey(new Date());

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line bg-page/60 text-center text-xs font-semibold tracking-wide text-muted uppercase">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-3">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date) => {
          const key = dayKey(date);
          const events = eventsByDay.get(key) ?? [];
          const outside = date.getMonth() !== month.getMonth();
          const isSelected = key === selected;
          const label = `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${events.length} event${events.length === 1 ? '' : 's'}`;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-label={label}
              aria-pressed={isSelected}
              className={clsx(
                'flex min-h-[58px] flex-col items-center gap-1 border-r border-b border-line p-1.5 text-left transition-colors [&:nth-child(7n)]:border-r-0 md:min-h-[104px] md:items-stretch md:p-2',
                isSelected ? 'bg-primary-soft/60' : 'hover:bg-page',
              )}
            >
              <span
                className={clsx(
                  'grid size-7 shrink-0 place-items-center rounded-full text-sm font-medium',
                  key === today && 'bg-primary text-white',
                  key !== today && (outside ? 'text-subtle' : 'text-navy'),
                )}
              >
                {date.getDate()}
              </span>
              <span className="flex flex-wrap justify-center gap-1 md:hidden" aria-hidden>
                {events.slice(0, MAX_DOTS).map((e) => (
                  <span key={e.id} className={clsx('size-1.5 rounded-full', eventTone(e).dot)} />
                ))}
              </span>
              <span className="hidden min-w-0 flex-col gap-1 md:flex" aria-hidden>
                {events.slice(0, MAX_CHIPS).map((e) => (
                  <span key={e.id} className={clsx('truncate rounded-md px-2 py-0.5 text-xs font-medium', eventTone(e).chip)}>
                    {e.title}
                  </span>
                ))}
                {events.length > MAX_CHIPS && <span className="px-2 text-xs text-muted">+{events.length - MAX_CHIPS} more</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
