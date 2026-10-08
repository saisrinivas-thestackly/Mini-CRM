import { ArrowLeft, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { PanelTitle, TaskLine } from '../components/dashboard/SidePanels';
import { RoomGallery } from '../components/deals/RoomGallery';
import { ActivityLog, RecordActivityForm } from '../components/deals/ActivityLog';
import { PanelLayout } from '../components/layout/AppLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { IconButton } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Select } from '../components/ui/Form';
import { EmptyState, ErrorState, LoadingRows, PageLoader } from '../components/ui/States';
import { useModals } from '../context/ModalsContext';
import { useDeal, useDeleteDeal, useMoveDeal, useTasks } from '../hooks/useData';
import { ApiError } from '../lib/api';
import { formatAddress, formatDate, formatDateTime, formatMoney, ROOM_ACCESS_LABEL, STAGE_LABEL, STAGES } from '../lib/format';
import type { Deal, DealStage } from '../lib/types';
import { NotFoundState } from './NotFoundPage';

const BackLink = () => (
  <Link to="/deals" aria-label="Back to deals" className="-ml-2 rounded-full p-2 text-muted hover:text-navy">
    <ArrowLeft className="size-5" />
  </Link>
);

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[15px] text-muted">{label}</dt>
      <dd className="mt-2 text-lg font-semibold text-ink">{children}</dd>
    </div>
  );
}

export function DealDetailPage() {
  const { id } = useParams();
  const query = useDeal(id);

  if (query.isPending) {
    return (
      <>
        <PageHeader title="Deal Details" back={<BackLink />} />
        <PageLoader />
      </>
    );
  }
  if (query.isError) {
    const missing = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);
    return (
      <>
        <PageHeader title="Deal Details" back={<BackLink />} />
        {missing ? (
          <NotFoundState title="Deal not found" message="It may have been deleted, or it belongs to another account." to="/deals" cta="Back to deals" />
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )}
      </>
    );
  }
  return <DealDetail deal={query.data} />;
}

function DealDetail({ deal }: { deal: Deal }) {
  const navigate = useNavigate();
  const { open } = useModals();
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteDeal();
  const move = useMoveDeal();
  const tasks = useTasks({ deal: deal.id, sort: 'dueDate', limit: 10 });

  const onDelete = async () => {
    await remove.mutateAsync(deal.id);
    navigate('/deals', { replace: true });
  };

  return (
    <>
      <PageHeader title="Deal Details" back={<BackLink />} />
      <PanelLayout
        panel={
          <>
            <RecordActivityForm dealId={deal.id} />
            <h2 className="mt-10 mb-4 text-lg font-bold text-navy">Activity Log</h2>
            <ActivityLog dealId={deal.id} />
          </>
        }
      >
        <div className="-mx-4 -mt-4 flex flex-wrap items-center gap-x-10 gap-y-4 border-b border-line px-4 py-6 sm:-mx-6 sm:-mt-6 sm:px-6">
          {deal.customer ? (
            <Link to={`/customers/${deal.customer.id}`} className="flex items-center gap-4 hover:opacity-80">
              <Avatar name={deal.customer.name} src={deal.customer.avatar} size={56} />
              <span>
                <span className="block text-[15px] text-muted">Customer</span>
                <span className="block text-lg font-semibold text-ink">{deal.customer.name}</span>
              </span>
            </Link>
          ) : (
            <span className="text-muted">No customer</span>
          )}
          {deal.customer?.email && (
            <div className="min-w-0">
              <p className="text-[15px] text-muted">Email</p>
              <a href={`mailto:${deal.customer.email}`} className="block truncate text-lg font-semibold text-ink hover:text-primary">
                {deal.customer.email}
              </a>
            </div>
          )}
          {deal.customer?.phone && (
            <div>
              <p className="text-[15px] text-muted">Phone</p>
              <a href={`tel:${deal.customer.phone}`} className="text-lg font-semibold text-ink hover:text-primary">
                {deal.customer.phone}
              </a>
            </div>
          )}
        </div>

        <div className="-mx-4 flex items-start gap-4 border-b border-line bg-white px-4 py-7 sm:-mx-6 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl leading-tight font-bold text-navy sm:text-[34px]">{deal.title}</h2>
            {formatAddress(deal.address) && <p className="mt-2 text-muted">{formatAddress(deal.address)}</p>}
          </div>
          <IconButton label="Delete deal" className="size-12 sm:size-14" onClick={() => setConfirming(true)}>
            <Trash2 className="size-5" strokeWidth={1.6} />
          </IconButton>
          <IconButton label="Edit deal" className="size-12 sm:size-14" onClick={() => open({ type: 'dealForm', deal })}>
            <Pencil className="size-5" strokeWidth={1.6} />
          </IconButton>
        </div>

        <div className="grid grid-cols-1 gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
          <dl className="grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2">
            <div>
              <dt className="text-[15px] text-muted">
                <label htmlFor="deal-stage-inline">Stage</label>
              </dt>
              <dd className="mt-2">
                <Select
                  id="deal-stage-inline"
                  value={deal.stage}
                  disabled={move.isPending}
                  onChange={(e) => move.mutate({ id: deal.id, stage: e.target.value as DealStage })}
                  wrapperClassName="max-w-[220px]"
                  className="h-11 font-semibold"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </dd>
            </div>
            <Detail label="Appointment Date">{formatDateTime(deal.appointmentDate)}</Detail>
            <Detail label="Room Area">{deal.roomArea != null ? `${deal.roomArea} M²` : '—'}</Detail>
            <Detail label="Number of people">{deal.people ?? '—'}</Detail>
            <Detail label="Price">{formatMoney(deal.value)}</Detail>
            <Detail label="Room Access">{ROOM_ACCESS_LABEL[deal.roomAccess]}</Detail>
            <Detail label="Expected Close">{formatDate(deal.expectedCloseDate)}</Detail>
            {deal.closedAt && <Detail label={deal.stage === 'won' ? 'Won on' : 'Closed on'}>{formatDate(deal.closedAt)}</Detail>}
            <div className="sm:col-span-2">
              <dt className="text-[15px] text-muted">Special Instructions</dt>
              <dd className="mt-3 text-lg leading-8 whitespace-pre-line text-ink">{deal.instructions || '—'}</dd>
            </div>
          </dl>

          <RoomGallery images={deal.images ?? []} title={deal.title} onAdd={() => open({ type: 'dealForm', deal })} />

          <section className="card self-start overflow-hidden lg:col-span-2">
            <div className="px-6 pt-6">
              <PanelTitle
                title="Tasks"
                action={
                  <IconButton
                    label="Add task for this deal"
                    tone="primary"
                    className="size-10"
                    onClick={() => open({ type: 'taskForm', defaults: { deal: deal.id, customer: deal.customer?.id } })}
                  >
                    <Plus className="size-5" />
                  </IconButton>
                }
              />
            </div>
            {tasks.isPending && <div className="px-6"><LoadingRows rows={2} avatar={false} /></div>}
            {tasks.isError && <ErrorState error={tasks.error} onRetry={() => tasks.refetch()} />}
            {tasks.isSuccess && tasks.data.data.length === 0 && (
              <EmptyState variant="inline" icon={<ListChecks />} message="No tasks for this deal." className="px-6 pb-5" />
            )}
            <ul className="pb-2">
              {tasks.data?.data.map((t) => <TaskLine key={t.id} task={t} onClick={() => open({ type: 'taskForm', task: t })} />)}
            </ul>
          </section>
        </div>
      </PanelLayout>

      {confirming && (
        <ConfirmDialog
          title="Delete deal?"
          message={`This permanently deletes “${deal.title}” and its activity log. Linked tasks are kept.`}
          loading={remove.isPending}
          onConfirm={onDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
