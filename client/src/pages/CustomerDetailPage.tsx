import { ArrowLeft, ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CustomerFields } from '../components/customers/CustomerFields';
import { toCustomerForm, toCustomerInput, validateCustomer, type CustomerForm } from '../lib/customerForm';
import { DealRow, NoDeals } from '../components/dashboard/DashboardCards';
import { PanelTitle, TaskLine } from '../components/dashboard/SidePanels';
import { PanelLayout } from '../components/layout/AppLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { Button, IconButton } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FormError } from '../components/ui/Form';
import { StatusPill } from '../components/ui/Pills';
import { EmptyState, ErrorState, LoadingRows, PageLoader } from '../components/ui/States';
import { useModals } from '../context/ModalsContext';
import { useCustomer, useDeals, useDeleteCustomer, useSaveCustomer, useTasks } from '../hooks/useData';
import { ApiError, errorMessage } from '../lib/api';
import { IMAGE_ACCEPT, ImageError, readImage } from '../lib/images';
import type { Customer } from '../lib/types';
import { NotFoundState } from './NotFoundPage';

const BackLink = () => (
  <Link to="/customers" aria-label="Back to customers" className="-ml-2 rounded-full p-2 text-muted hover:text-navy">
    <ArrowLeft className="size-5" />
  </Link>
);

export function CustomerDetailPage() {
  const { id } = useParams();
  const query = useCustomer(id);

  if (query.isPending) {
    return (
      <>
        <PageHeader title="Customer Details" back={<BackLink />} />
        <PageLoader />
      </>
    );
  }
  if (query.isError) {
    const missing = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);
    return (
      <>
        <PageHeader title="Customer Details" back={<BackLink />} />
        {missing ? (
          <NotFoundState title="Customer not found" message="It may have been deleted, or it belongs to another account." to="/customers" cta="Back to customers" />
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )}
      </>
    );
  }

  return <CustomerDetail key={`${query.data.customer.id}-${query.data.customer.updatedAt}`} customer={query.data.customer} />;
}

function CustomerDetail({ customer }: { customer: Customer }) {
  const navigate = useNavigate();
  const { open, newDeal } = useModals();
  const [form, setForm] = useState<CustomerForm>(() => toCustomerForm(customer));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const save = useSaveCustomer();
  const remove = useDeleteCustomer();
  const deals = useDeals({ customer: customer.id, limit: 5, sort: '-createdAt' });
  const tasks = useTasks({ customer: customer.id, sort: 'dueDate', limit: 6 });
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const initial = toCustomerForm(customer);
  const dirty = (Object.keys(form) as (keyof CustomerForm)[]).some((k) => form[k] !== initial[k]);

  const onChange = (patch: Partial<CustomerForm>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const clientErrors = validateCustomer(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;
    try {
      await save.mutateAsync({ id: customer.id, body: toCustomerInput(form) });
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
    }
  };

  const onAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError(null);
    try {
      onChange({ avatar: await readImage(file, { maxSize: 256, square: true, quality: 0.82 }) });
    } catch (err) {
      setAvatarError(err instanceof ImageError ? err.message : 'Could not use that image.');
    }
  };

  const onDelete = async () => {
    await remove.mutateAsync(customer.id);
    navigate('/customers', { replace: true });
  };

  return (
    <>
      <PageHeader title="Customer Details" back={<BackLink />} />
      <PanelLayout
        panel={
          <>
            <PanelTitle
              title="Recent Deals"
              action={
                <IconButton label="Add deal for this customer" tone="primary" className="size-10" onClick={() => newDeal(customer)}>
                  <Plus className="size-5" />
                </IconButton>
              }
            />
            {deals.isPending && <LoadingRows rows={3} />}
            {deals.isError && <ErrorState error={deals.error} onRetry={() => deals.refetch()} />}
            {deals.isSuccess && deals.data.data.length === 0 && <NoDeals className="py-6" />}
            <ul>{deals.data?.data.map((d) => <DealRow key={d.id} deal={d} />)}</ul>
            {deals.data && deals.data.total > deals.data.data.length && (
              <div className="pt-3 text-center">
                <Link to={`/deals?customer=${customer.id}`} className="font-medium text-primary hover:underline">
                  Load More
                </Link>
              </div>
            )}

            <section className="card mt-8 overflow-hidden">
              <div className="px-6 pt-6">
                <PanelTitle
                  title="Tasks"
                  to={`/tasks?customer=${customer.id}`}
                  action={
                    <IconButton label="Add task for this customer" tone="primary" className="size-10" onClick={() => open({ type: 'taskForm', defaults: { customer: customer.id } })}>
                      <Plus className="size-5" />
                    </IconButton>
                  }
                />
              </div>
              {tasks.isPending && <div className="px-6"><LoadingRows rows={2} avatar={false} /></div>}
              {tasks.isError && <ErrorState error={tasks.error} onRetry={() => tasks.refetch()} />}
              {tasks.isSuccess && tasks.data.data.length === 0 && (
                <EmptyState variant="inline" icon={<ListChecks />} message="No tasks for this customer yet." className="px-6 pb-5" />
              )}
              <ul className="pb-2">
                {tasks.data?.data.map((t) => <TaskLine key={t.id} task={t} onClick={() => open({ type: 'taskForm', task: t })} />)}
              </ul>
            </section>
          </>
        }
      >
        <form onSubmit={submit} noValidate>
          <div className="relative mb-7 h-44 overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#d9dee7_0%,#f4f6f9_45%,#e3e7ee_70%,#f7f8fa_100%)] sm:h-52">
            <svg aria-hidden className="absolute inset-0 size-full opacity-70" viewBox="0 0 800 200" preserveAspectRatio="none">
              <path d="M0 150 C 200 60, 380 220, 560 90 S 800 40, 800 40 V200 H0Z" fill="#fff" fillOpacity="0.45" />
            </svg>
            <div className="absolute bottom-6 left-6 flex items-end gap-4">
              <div className="relative shrink-0">
                <Avatar name={customer.name} src={form.avatar} size={96} className="ring-4 ring-white" />
                <button
                  type="button"
                  aria-label="Change avatar"
                  onClick={() => fileRef.current?.click()}
                  disabled={save.isPending}
                  className="absolute right-0 bottom-0 grid size-8 place-items-center rounded-full bg-primary text-white ring-2 ring-white hover:bg-primary-dark"
                >
                  <Pencil className="size-4" />
                </button>
                {form.avatar && (
                  <button
                    type="button"
                    aria-label="Remove avatar"
                    onClick={() => onChange({ avatar: '' })}
                    disabled={save.isPending}
                    className="absolute top-0 right-0 grid size-6 place-items-center rounded-full bg-navy/70 text-white ring-2 ring-white hover:bg-navy"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
                <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} className="sr-only" tabIndex={-1} onChange={onAvatar} aria-label="Upload avatar" />
              </div>
              <div className="pb-2">
                <p className="text-xl font-bold text-navy">{customer.name}</p>
                <StatusPill status={customer.status} className="mt-1" />
              </div>
            </div>
            <IconButton label="Delete customer" className="absolute right-6 bottom-6 size-12 border-0" onClick={() => setConfirming(true)}>
              <Trash2 className="size-5" strokeWidth={1.6} />
            </IconButton>
          </div>

          <FormError message={avatarError ?? (save.isError ? errorMessage(save.error) : null)} />
          <CustomerFields form={form} errors={errors} onChange={onChange} disabled={save.isPending} idPrefix="customer-detail" />

          <div className="mt-8 flex justify-end gap-3">
            {dirty && (
              <Button variant="secondary" onClick={() => { setForm(initial); setErrors({}); }} disabled={save.isPending}>
                Discard
              </Button>
            )}
            <Button type="submit" size="lg" loading={save.isPending} disabled={!dirty}>
              {save.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </PanelLayout>

      {confirming && (
        <ConfirmDialog
          title="Delete customer?"
          message={`This permanently deletes ${customer.name} along with their deals, activity and tasks.`}
          loading={remove.isPending}
          onConfirm={onDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
