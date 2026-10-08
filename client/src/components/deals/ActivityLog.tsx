import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useModals } from '../../context/ModalsContext';
import { useActivities, useSaveActivity } from '../../hooks/useData';
import { ApiError, errorMessage } from '../../lib/api';
import { formatDayMonthYear, fromInput, toDateTimeInput } from '../../lib/format';
import { Button } from '../ui/Button';
import { Field, FormError, Input } from '../ui/Form';
import { ImagePicker } from '../ui/ImagePicker';
import { ActivityIcon, EmptyState, ErrorState, LoadingRows, Spinner } from '../ui/States';

export function ActivityLog({ dealId, limit, moreTo }: { dealId: string; limit?: number; moreTo?: string }) {
  const { open } = useModals();
  const query = useActivities(dealId);
  const all = query.data?.pages.flatMap((p) => p.data) ?? [];
  const items = limit ? all.slice(0, limit) : all;
  const hasMore = all.length > items.length || !!query.hasNextPage;

  if (query.isPending) return <LoadingRows rows={2} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (items.length === 0) return <EmptyState icon={<ActivityIcon />} message="No activity logged." className={limit ? 'py-6' : 'py-10'} />;

  return (
    <div>
      <ol className="relative">
        <span aria-hidden className="absolute top-3 bottom-3 left-[21px] w-px bg-line" />
        {items.map((a) => (
          <li key={a.id} className="relative">
            <button
              type="button"
              onClick={() => open({ type: 'activity', activity: a, dealId })}
              className="flex w-full items-start gap-5 rounded-xl py-3 pr-2 text-left transition-colors hover:bg-white/60"
            >
              <span className="relative z-10 grid size-[44px] shrink-0 place-items-center rounded-full bg-primary" aria-hidden>
                <span className="size-3 rounded-full bg-white" />
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <span className="block text-sm text-muted">{formatDayMonthYear(a.date)}</span>
                <span className="mt-1 block text-[15px] text-navy">{a.description}</span>
                {!!a.images?.length && (
                  <span className="mt-3 grid gap-2 sm:grid-cols-2">
                    {a.images.map((src, i) => (
                      <img key={i} src={src} alt="" className="h-28 w-full rounded-lg object-cover" />
                    ))}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {limit && moreTo && hasMore && (
        <div className="pt-2 pb-2 text-center">
          <Link to={moreTo} className="text-[16px] font-semibold text-primary hover:underline">
            Load More
          </Link>
        </div>
      )}
      {!limit && query.hasNextPage && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="text-[16px] font-semibold text-primary hover:underline disabled:opacity-60"
          >
            {query.isFetchingNextPage ? <Spinner /> : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

export function RecordActivityForm({ dealId }: { dealId: string }) {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => toDateTimeInput(new Date()));
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const save = useSaveActivity(dealId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return setError('Write a short description first');
    setError(null);
    try {
      await save.mutateAsync({ body: { description: description.trim(), date: fromInput(date) ?? undefined, images } });
      setDescription('');
      setImages([]);
      setDate(toDateTimeInput(new Date()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} noValidate className="card p-6">
      <h2 className="mb-6 text-lg font-bold text-navy">Record Activity</h2>
      <FormError message={error} />
      <Field label="Description" htmlFor="activity-new-description">
        <Input
          id="activity-new-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write your notes"
          disabled={save.isPending}
        />
      </Field>
      <div className="relative mt-4">
        <Input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Activity date and time"
          disabled={save.isPending}
        />
      </div>
      <ImagePicker
        label="Images"
        images={images}
        onChange={setImages}
        max={2}
        resize={{ maxSize: 1000, quality: 0.72 }}
        wide
        disabled={save.isPending}
        className="mt-6"
      />
      <div className="mt-6 flex justify-end">
        <Button type="submit" size="lg" loading={save.isPending}>
          Save
        </Button>
      </div>
    </form>
  );
}
