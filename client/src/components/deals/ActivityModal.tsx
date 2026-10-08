import { useEffect, useState, type FormEvent } from 'react';
import { useDeleteActivity, useSaveActivity } from '../../hooks/useData';
import { ApiError, errorMessage } from '../../lib/api';
import { fromInput, toDateTimeInput } from '../../lib/format';
import type { Activity } from '../../lib/types';
import { Button } from '../ui/Button';
import { ImagePicker } from '../ui/ImagePicker';
import { Field, FormError, Input } from '../ui/Form';
import { Modal } from '../ui/Modal';

interface Props {
  activity: Activity;
  dealId: string;
  onClose: () => void;
  hidden?: boolean;
}

export function ActivityModal({ activity, dealId, onClose, hidden }: Props) {
  const [description, setDescription] = useState(activity.description);
  const [date, setDate] = useState(toDateTimeInput(activity.date));
  const [images, setImages] = useState<string[]>(activity.images ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = useSaveActivity(dealId);
  const remove = useDeleteActivity();

  useEffect(() => {
    if (!confirmDelete) return;
    const t = window.setTimeout(() => setConfirmDelete(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmDelete]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return setErrors({ description: 'Description is required' });
    if (!date) return setErrors({ date: 'Date is required' });
    try {
      await save.mutateAsync({ id: activity.id, body: { description: description.trim(), date: fromInput(date)!, images } });
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
    }
  };

  const onDelete = async () => {
    if (!confirmDelete) return setConfirmDelete(true);
    await remove.mutateAsync(activity.id);
    onClose();
  };

  const busy = save.isPending || remove.isPending;

  return (
    <Modal title="Edit Activity" onClose={onClose} hidden={hidden} size="md" tone="soft">
      <form onSubmit={submit} noValidate className="pt-5">
        <FormError message={save.isError ? errorMessage(save.error) : null} />
        <Field htmlFor="activity-description" error={errors.description}>
          <Input
            id="activity-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-white"
            aria-label="Description"
            invalid={!!errors.description}
            disabled={busy}
          />
        </Field>
        <Field htmlFor="activity-date" error={errors.date} className="mt-5">
          <Input
            id="activity-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white"
            aria-label="Date and time"
            invalid={!!errors.date}
            disabled={busy}
          />
        </Field>
        <ImagePicker
          label="Images"
          images={images}
          onChange={setImages}
          max={2}
          resize={{ maxSize: 1000, quality: 0.72 }}
          wide
          disabled={busy}
          className="mt-6 [&_button.bg-field]:bg-white"
        />

        <div className="modal-actions mt-10 grid grid-cols-2 items-center gap-4">
          <Button variant="danger" onClick={onDelete} loading={remove.isPending} disabled={busy}>
            {confirmDelete ? 'Tap again to delete' : 'Delete'}
          </Button>
          <Button type="submit" size="lg" loading={save.isPending} disabled={busy}>
            Done
          </Button>
        </div>
      </form>
    </Modal>
  );
}
