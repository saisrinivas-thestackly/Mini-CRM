import clsx from 'clsx';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useModals } from '../../context/ModalsContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../lib/api';
import { eventTone } from '../../lib/calendar';
import { tasksApi } from '../../lib/services';
import type { CalendarEvent } from '../../lib/types';
import { EmptyState, LoadingRows } from '../ui/States';

const timeOf = (value: string) => new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

function Row({ event, time }: { event: CalendarEvent; time: string }) {
  const tone = eventTone(event);
  return (
    <>
      <span className={clsx('size-2.5 shrink-0 rounded-full', tone.dot)} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className={clsx('block truncate font-medium', event.done ? 'text-muted line-through' : 'text-navy')}>{event.title}</span>
        <span className="block truncate text-sm text-muted">
          {tone.label} · {time}
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden />
    </>
  );
}

export function DayAgenda({ date, events, loading }: { date: Date; events: CalendarEvent[]; loading: boolean }) {
  const { open } = useModals();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [opening, setOpening] = useState<string | null>(null);

  const openTask = async (event: CalendarEvent) => {
    setOpening(event.id);
    try {
      const task = await queryClient.fetchQuery({ queryKey: ['task', event.refId], queryFn: () => tasksApi.get(event.refId), staleTime: 0 });
      open({ type: 'taskForm', task });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setOpening(null);
    }
  };

  const rowClass = 'flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left transition-colors hover:bg-primary-soft/50 disabled:opacity-60';

  return (
    <section aria-live="polite">
      <h2 className="text-lg font-bold text-navy">{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
      <p className="mt-1 mb-5 text-sm text-muted">
        {loading ? 'Loading…' : `${events.length} scheduled item${events.length === 1 ? '' : 's'}`}
      </p>
      {loading && <LoadingRows rows={3} avatar={false} />}
      {!loading && events.length === 0 && <EmptyState variant="inline" icon={<CalendarDays />} message="Nothing scheduled for this day." />}
      {!loading && (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id}>
              {event.type === 'task' ? (
                <button type="button" onClick={() => openTask(event)} disabled={opening === event.id} className={rowClass}>
                  <Row event={event} time={timeOf(event.date)} />
                </button>
              ) : (
                <Link to={`/deals/${event.refId}`} className={rowClass}>
                  <Row event={event} time={event.type === 'close' ? 'Deal' : timeOf(event.date)} />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
