import type { ChangeEvent } from 'react';
import { CUSTOMER_STATUSES, STATUS_LABEL } from '../../lib/format';
import type { CustomerForm } from '../../lib/customerForm';
import type { CustomerStatus } from '../../lib/types';
import { Field, Input, Select, Textarea } from '../ui/Form';

interface Props {
  form: CustomerForm;
  errors: Record<string, string>;
  onChange: (patch: Partial<CustomerForm>) => void;
  disabled?: boolean;
  idPrefix: string;
}

export function CustomerFields({ form, errors, onChange, disabled, idPrefix }: Props) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const text = (name: keyof CustomerForm) => ({
    id: id(name),
    name,
    value: form[name],
    disabled,
    invalid: !!errors[name],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ [name]: e.target.value }),
  });

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
      <Field label="First Name" htmlFor={id('firstName')} error={errors.firstName}>
        <Input {...text('firstName')} autoComplete="given-name" required />
      </Field>
      <Field label="Last Name" htmlFor={id('lastName')} error={errors.lastName}>
        <Input {...text('lastName')} autoComplete="family-name" required />
      </Field>
      <Field label="Email" htmlFor={id('email')} error={errors.email}>
        <Input {...text('email')} type="email" autoComplete="email" required />
      </Field>
      <Field label="Phone" htmlFor={id('phone')} error={errors.phone}>
        <Input {...text('phone')} type="tel" autoComplete="tel" />
      </Field>
      <Field label="Company" htmlFor={id('company')} error={errors.company}>
        <Input {...text('company')} autoComplete="organization" />
      </Field>
      <Field label="Status" htmlFor={id('status')} error={errors.status}>
        <Select
          id={id('status')}
          value={form.status}
          disabled={disabled}
          onChange={(e) => onChange({ status: e.target.value as CustomerStatus })}
        >
          {CUSTOMER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </Field>

      <fieldset className="sm:col-span-2">
        <legend className="label">Address</legend>
        <Input {...text('street')} aria-label="Street address" placeholder="Street Address" autoComplete="street-address" invalid={!!errors['address.street']} />
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-[1.6fr_1.2fr_0.8fr]">
          <Input {...text('city')} aria-label="City" placeholder="City" className="col-span-2 sm:col-span-1" invalid={!!errors['address.city']} />
          <Input {...text('state')} aria-label="State / Province" placeholder="State / Province" invalid={!!errors['address.state']} />
          <Input {...text('zip')} aria-label="Zip code" placeholder="Zip Code" autoComplete="postal-code" invalid={!!errors['address.zip']} />
        </div>
      </fieldset>

      <Field label="Notes" htmlFor={id('notes')} error={errors.notes} className="sm:col-span-2">
        <Textarea {...text('notes')} placeholder="Anything worth remembering about this customer" />
      </Field>
    </div>
  );
}
