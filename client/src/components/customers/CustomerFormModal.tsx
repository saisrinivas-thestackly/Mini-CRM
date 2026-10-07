import { useState, type FormEvent } from 'react';
import { useSaveCustomer } from '../../hooks/useData';
import { ApiError, errorMessage } from '../../lib/api';
import type { Customer } from '../../lib/types';
import { Button } from '../ui/Button';
import { FormError } from '../ui/Form';
import { ImagePicker } from '../ui/ImagePicker';
import { Modal } from '../ui/Modal';
import { CustomerFields } from './CustomerFields';
import { toCustomerForm, toCustomerInput, validateCustomer, type CustomerForm } from '../../lib/customerForm';

interface Props {
  customer?: Customer;
  onSaved?: (customer: Customer) => void;
  onClose: () => void;
  hidden?: boolean;
}

export function CustomerFormModal({ customer, onSaved, onClose, hidden }: Props) {
  const [form, setForm] = useState<CustomerForm>(() => toCustomerForm(customer));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useSaveCustomer();

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
      const saved = await save.mutateAsync({ id: customer?.id, body: toCustomerInput(form) });
      if (onSaved) onSaved(saved);
      else onClose();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
    }
  };

  return (
    <Modal title={customer ? 'Edit Customer' : 'Add New Customer'} onClose={onClose} hidden={hidden} size="lg">
      <form onSubmit={submit} noValidate className="pt-4">
        <FormError message={save.isError ? errorMessage(save.error) : null} />
        <ImagePicker
          label="Avatar"
          images={form.avatar ? [form.avatar] : []}
          onChange={(imgs) => onChange({ avatar: imgs[0] ?? '' })}
          max={1}
          resize={{ maxSize: 256, square: true, quality: 0.82 }}
          round
          disabled={save.isPending}
          className="mb-6"
        />
        <CustomerFields form={form} errors={errors} onChange={onChange} disabled={save.isPending} idPrefix="customer-modal" />
        <div className="modal-actions mt-8 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" size="lg" loading={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
