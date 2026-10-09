import { Check } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import clsx from 'clsx';
import { useCustomers, useDeals, useDeleteTask, useSaveTask } from '../../hooks/useData';
import { ApiError, errorMessage } from '../../lib/api';
import { fromInput, PRIORITIES, PRIORITY_LABEL, toDateTimeInput } from '../../lib/format';
import type { Task, TaskPriority } from '../../lib/types';
import { Button } from '../ui/Button';
import { Field, FormError, Input, Select, Textarea } from '../ui/Form';
import { Modal } from '../ui/Modal';

export interface TaskDefaults {
  title?: string;
  customer?: string;
  deal?: string;
  dueDate?: string;
}

interface Props {
  task?: Task;
  defaults?: TaskDefaults;
  onClose: () => void;
  hidden?: boolean;
}

function defaultDue() {
  const d = new Date();
  d.setHours(17, 0, 0, 0);
  if (d.getTime() < Date.now()) d.setTime(Date.now() + 60 * 60 * 1000);
  return toDateTimeInput(d);
}

export function TaskFormModal({ task, defaults, onClose, hidden }: Props) {
  const [title, setTitle] = useState(task?.title ?? defaults?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task ? toDateTimeInput(task.dueDate) : (defaults?.dueDate ?? defaultDue()));
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [done, setDone] = useState(task?.done ?? false);
  const [customer, setCustomer] = useState(task?.customer?.id ?? defaults?.customer ?? '');
  const [deal, setDeal] = useState(task?.deal?.id ?? defaults?.deal ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useSaveTask();
  const remove = useDeleteTask();
  const customers = useCustomers({ limit: 100, sort: 'firstName' });
  const deals = useDeals({ customer: customer || undefined, limit: 100 }, !!customer);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = window.setTimeout(() => setConfirmDelete(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmDelete]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const clientErrors: Record<string, string> = {};
    if (!title.trim()) clientErrors.title = 'Task description is required';
    if (!dueDate) clientErrors.dueDate = 'Due date is required';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    try {
      await save.mutateAsync({
        id: task?.id,
        body: {
          title: title.trim(),
          description: description.trim(),
          dueDate: fromInput(dueDate)!,
          priority,
          done,
          customer: customer || null,
          deal: deal || null,
        },
      });
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
    }
  };

  const onDelete = async () => {
    if (!task) return;
    if (!confirmDelete) return setConfirmDelete(true);
    await remove.mutateAsync(task.id);
    onClose();
  };

  const busy = save.isPending || remove.isPending;

  return (
    <Modal title={task ? 'Edit Task' : 'Add New Task'} onClose={onClose} hidden={hidden} size="md">
      <form onSubmit={submit} noValidate className="space-y-5 pt-5">
        <FormError message={save.isError ? errorMessage(save.error) : null} />

        {task && (
          <label className="flex cursor-pointer items-center justify-between py-1">
            <span className="text-[17px] font-bold text-navy">Complete?</span>
            <input type="checkbox" className="peer sr-only" checked={done} onChange={(e) => setDone(e.target.checked)} />
            <span
              aria-hidden
              className={clsx(
                'grid size-8 place-items-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary',
                done ? 'border-success bg-success text-white' : 'border-line bg-field',
              )}
            >
              {done && <Check className="size-5" strokeWidth={3} />}
            </span>
          </label>
        )}

        <Field label={task ? 'Description' : undefined} htmlFor="task-title" error={errors.title}>
          <Textarea
            id="task-title"
            rows={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task description"
            invalid={!!errors.title}
            disabled={busy}
            aria-label="Task description"
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Due Date" htmlFor="task-due" error={errors.dueDate}>
            <Input id="task-due" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} invalid={!!errors.dueDate} disabled={busy} />
          </Field>
          <Field label="Priority" htmlFor="task-priority">
            <Select id="task-priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} disabled={busy}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Customer" htmlFor="task-customer" error={errors.customer}>
            <Select
              id="task-customer"
              value={customer}
              disabled={busy || customers.isPending}
              onChange={(e) => {
                setCustomer(e.target.value);
                setDeal('');
              }}
            >
              <option value="">{customers.isPending ? 'Loading…' : 'None'}</option>
              {customers.data?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Deal" htmlFor="task-deal" error={errors.deal}>
            <Select id="task-deal" value={deal} onChange={(e) => setDeal(e.target.value)} disabled={busy || !customer}>
              <option value="">{customer ? 'None' : 'Pick a customer first'}</option>
              {deals.data?.data.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {task && (
          <Field label="Notes" htmlFor="task-notes">
            <Textarea id="task-notes" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} />
          </Field>
        )}

        <div className="modal-actions grid grid-cols-2 items-center gap-4 sm:pt-4">
          {task ? (
            <Button variant="danger" onClick={onDelete} loading={remove.isPending} disabled={busy}>
              {confirmDelete ? 'Tap again to delete' : 'Delete'}
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="lg" loading={save.isPending} disabled={busy}>
            {task ? 'Done' : 'Save Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
