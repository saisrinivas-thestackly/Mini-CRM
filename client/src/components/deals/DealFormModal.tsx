import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useModals } from '../../context/ModalsContext';
import { useDeal, useSaveDeal } from '../../hooks/useData';
import { ApiError, errorMessage } from '../../lib/api';
import { makeThumbnail } from '../../lib/images';
import { fromInput, ROOM_ACCESS_LABEL, STAGE_LABEL, STAGES, toDateInput, toDateTimeInput } from '../../lib/format';
import type { DealInput } from '../../lib/services';
import type { CustomerRef, Deal, DealStage, RoomAccess } from '../../lib/types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Field, FormError, Input, Select, Textarea } from '../ui/Form';
import { ImagePicker } from '../ui/ImagePicker';
import { Modal } from '../ui/Modal';

interface DealForm {
  title: string;
  value: string;
  stage: DealStage;
  street: string;
  city: string;
  state: string;
  zip: string;
  roomArea: string;
  people: string;
  appointmentDate: string;
  expectedCloseDate: string;
  instructions: string;
  roomAccess: RoomAccess;
}

function toForm(deal?: Deal): DealForm {
  return {
    title: deal?.title ?? '',
    value: deal ? String(deal.value) : '',
    stage: deal?.stage ?? 'lead',
    street: deal?.address?.street ?? '',
    city: deal?.address?.city ?? '',
    state: deal?.address?.state ?? '',
    zip: deal?.address?.zip ?? '',
    roomArea: deal?.roomArea != null ? String(deal.roomArea) : '',
    people: deal?.people != null ? String(deal.people) : '',
    appointmentDate: toDateTimeInput(deal?.appointmentDate),
    expectedCloseDate: toDateInput(deal?.expectedCloseDate),
    instructions: deal?.instructions ?? '',
    roomAccess: deal?.roomAccess ?? 'keys_with_doorman',
  };
}

const numberOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

function validate(f: DealForm, customer: CustomerRef | null) {
  const errors: Record<string, string> = {};
  if (!customer) errors.customer = 'Choose a customer';
  if (!f.title.trim()) errors.title = 'Title is required';
  if (f.value.trim() === '') errors.value = 'Price is required';
  else if (Number.isNaN(Number(f.value)) || Number(f.value) < 0) errors.value = 'Price must be a positive number';
  if (f.roomArea && (Number.isNaN(Number(f.roomArea)) || Number(f.roomArea) < 0)) errors.roomArea = 'Enter a valid area';
  if (f.people && !Number.isInteger(Number(f.people))) errors.people = 'Enter a whole number';
  return errors;
}

interface Props {
  deal?: Deal;
  initialCustomer: CustomerRef | null;
  onClose: () => void;
  hidden?: boolean;
}

export function DealFormModal({ deal, initialCustomer, onClose, hidden }: Props) {
  const { open, close } = useModals();
  const [customer, setCustomer] = useState<CustomerRef | null>(deal?.customer ?? initialCustomer);
  const [form, setForm] = useState<DealForm>(() => toForm(deal));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useSaveDeal();
  const full = useDeal(deal && !deal.images ? deal.id : undefined);
  const [images, setImages] = useState<string[] | null>(deal ? null : []);
  const shownImages = images ?? deal?.images ?? full.data?.images ?? null;

  const set = (name: keyof DealForm) => ({
    id: `deal-${name}`,
    value: form[name],
    disabled: save.isPending,
    invalid: !!errors[name],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [name]: e.target.value }));
      setErrors(({ [name]: _removed, ...rest }) => rest);
    },
  });

  const changeCustomer = () =>
    open({
      type: 'selectCustomer',
      onSelect: (c) => {
        close();
        setCustomer(c);
        setErrors(({ customer: _removed, ...rest }) => rest);
      },
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const clientErrors = validate(form, customer);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length || !customer) return;

    const body: DealInput = {
      customer: customer.id,
      title: form.title.trim(),
      value: Number(form.value),
      stage: form.stage,
      address: { street: form.street.trim(), city: form.city.trim(), state: form.state.trim(), zip: form.zip.trim() },
      roomArea: numberOrNull(form.roomArea),
      people: numberOrNull(form.people),
      appointmentDate: fromInput(form.appointmentDate),
      expectedCloseDate: fromInput(form.expectedCloseDate),
      instructions: form.instructions.trim(),
      roomAccess: form.roomAccess,
    };
    try {
      if (images) {
        body.images = images;
        body.thumbnail = images[0] ? await makeThumbnail(images[0]) : '';
      }
      await save.mutateAsync({ id: deal?.id, body });
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
    }
  };

  return (
    <Modal title={deal ? 'Edit Deal' : 'Add New Deal'} onClose={onClose} hidden={hidden} size="lg">
      <form onSubmit={submit} noValidate>
        <div className="-mx-6 mt-4 mb-7 flex flex-wrap items-center gap-4 bg-panel px-6 py-5 sm:-mx-8 sm:flex-nowrap sm:px-8">
          <Avatar name={customer?.name ?? null} src={customer?.avatar} size={52} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">Customer</p>
            <p className="truncate text-lg font-bold text-navy">{customer?.name ?? 'No customer selected'}</p>
            {errors.customer && <p className="text-sm text-danger">{errors.customer}</p>}
          </div>
          <Button variant="secondary" size="md" onClick={changeCustomer} disabled={save.isPending} className="h-12 max-sm:w-full">
            {customer ? 'Change Customer' : 'Choose Customer'}
          </Button>
        </div>

        <FormError message={save.isError ? errorMessage(save.error) : null} />

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <ImagePicker
            label="Room Images"
            images={shownImages ?? []}
            onChange={setImages}
            max={4}
            resize={{ maxSize: 1200, quality: 0.72 }}
            loading={shownImages === null}
            disabled={save.isPending}
            className="sm:col-span-2"
          />
          <Field label="Deal Title" htmlFor="deal-title" error={errors.title} className="sm:col-span-2">
            <Input {...set('title')} placeholder="e.g. 319 Haul Road renovation" required />
          </Field>

          <fieldset className="sm:col-span-2">
            <legend className="label">Address</legend>
            <Input {...set('street')} aria-label="Street address" placeholder="Street Address" />
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-[1.6fr_1.2fr_0.8fr]">
              <Input {...set('city')} aria-label="City" placeholder="City" className="col-span-2 sm:col-span-1" />
              <Input {...set('state')} aria-label="State / Province" placeholder="State / Province" />
              <Input {...set('zip')} aria-label="Zip code" placeholder="Zip Code" />
            </div>
          </fieldset>

          <Field label="Room Area (m2)" htmlFor="deal-roomArea" error={errors.roomArea}>
            <Input {...set('roomArea')} type="number" min={0} inputMode="decimal" />
          </Field>
          <Field label="# of People" htmlFor="deal-people" error={errors.people}>
            <Input {...set('people')} type="number" min={0} step={1} inputMode="numeric" />
          </Field>

          <Field label="Appointment Date" htmlFor="deal-appointmentDate" error={errors.appointmentDate}>
            <div className="relative">
              <Input {...set('appointmentDate')} type="datetime-local" />
            </div>
          </Field>
          <Field label="Expected Close Date" htmlFor="deal-expectedCloseDate" error={errors.expectedCloseDate}>
            <Input {...set('expectedCloseDate')} type="date" />
          </Field>

          <Field label="Special Instructions" htmlFor="deal-instructions" error={errors.instructions} className="sm:col-span-2">
            <Textarea {...set('instructions')} rows={2} placeholder="Leave a special instruction" />
          </Field>

          <Field label="Room Access" htmlFor="deal-roomAccess">
            <Select {...set('roomAccess')}>
              {Object.entries(ROOM_ACCESS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Price ($)" htmlFor="deal-value" error={errors.value}>
            <Input {...set('value')} type="number" min={0} inputMode="decimal" required />
          </Field>
        </div>

        <div className="mt-8 max-sm:contents sm:flex sm:items-center sm:gap-4">
          <div className="flex items-center gap-4 max-sm:mt-6">
            <label htmlFor="deal-stage" className="text-[15px] font-bold text-navy">
              Stage
            </label>
            <Select {...set('stage')} wrapperClassName="w-44">
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="modal-actions flex items-center justify-end gap-3 max-sm:mt-6 sm:ml-auto">
            <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" size="lg" loading={save.isPending}>
              {save.isPending ? 'Saving…' : deal ? 'Done' : 'Save Deal'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
