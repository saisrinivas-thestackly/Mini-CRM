import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { DayAgenda } from '../components/calendar/DayAgenda';
import { MonthGrid } from '../components/calendar/MonthGrid';
import { PanelLayout } from '../components/layout/AppLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { ErrorState } from '../components/ui/States';
import { useModals } from '../context/ModalsContext';
import { useCalendar } from '../hooks/useData';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { addMonths, dayKey, groupByDay, monthGrid, monthKey, parseDay, parseMonth } from '../lib/calendar';

const LEGEND = [
  { label: 'Task', dot: 'bg-primary' },
  { label: 'Overdue', dot: 'bg-danger' },
  { label: 'Appointment', dot: 'bg-success' },
  { label: 'Expected close', dot: 'bg-warning' },
];

export function CalendarPage() {
  const { open } = useModals();
  const { values, setFilters } = useUrlFilters({ month: '', day: '' });

  const todayKey = dayKey(new Date());
  const month = useMemo(() => parseMonth(values.month, new Date()), [values.month]);
  const currentMonth = monthKey(month);
  const grid = useMemo(() => monthGrid(month), [month]);
  const fallbackDay = todayKey.startsWith(currentMonth) ? todayKey : `${currentMonth}-01`;
  const selected = parseDay(values.day) ? values.day : fallbackDay;
  const selectedDate = parseDay(selected) ?? month;

  const query = useCalendar(grid.from, grid.to);
  const eventsByDay = useMemo(() => groupByDay(query.data ?? []), [query.data]);

  const goTo = (target: Date) => setFilters({ month: monthKey(target) === monthKey(new Date()) ? '' : monthKey(target), day: '' });
  const selectDay = (day: string) => setFilters({ day, month: day.slice(0, 7) === monthKey(new Date()) ? '' : day.slice(0, 7) });
  const addTask = () => open({ type: 'taskForm', defaults: selected > todayKey ? { dueDate: `${selected}T09:00` } : undefined });

  return (
    <>
      <PageHeader title="Calendar" actionLabel="Add New Task" onAction={addTask} />
      <PanelLayout panel={<DayAgenda date={selectedDate} events={eventsByDay.get(selected) ?? []} loading={query.isPending} />}>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <IconButton label="Previous month" className="size-11" onClick={() => goTo(addMonths(month, -1))}>
            <ChevronLeft className="size-5" />
          </IconButton>
          <h2 className="min-w-[150px] text-center text-lg font-bold text-navy" aria-live="polite">
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <IconButton label="Next month" className="size-11" onClick={() => goTo(addMonths(month, 1))}>
            <ChevronRight className="size-5" />
          </IconButton>
          <Button variant="secondary" onClick={() => setFilters({ month: '', day: '' })}>
            Today
          </Button>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted sm:ml-auto">
            {LEGEND.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${item.dot}`} aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {query.isError ? (
          <div className="card">
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          </div>
        ) : (
          <div className={query.isFetching ? 'opacity-70 transition-opacity' : undefined} aria-busy={query.isFetching}>
            <MonthGrid days={grid.days} month={month} selected={selected} eventsByDay={eventsByDay} onSelect={selectDay} />
          </div>
        )}
      </PanelLayout>
    </>
  );
}
