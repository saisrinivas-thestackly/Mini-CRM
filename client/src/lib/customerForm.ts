import type { CustomerInput } from './services';
import type { Customer, CustomerStatus } from './types';

export interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  street: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  avatar: string;
}

export const emptyCustomerForm: CustomerForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  status: 'lead',
  street: '',
  city: '',
  state: '',
  zip: '',
  notes: '',
  avatar: '',
};

export function toCustomerForm(c?: Customer | null): CustomerForm {
  if (!c) return { ...emptyCustomerForm };
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    company: c.company,
    status: c.status,
    street: c.address?.street ?? '',
    city: c.address?.city ?? '',
    state: c.address?.state ?? '',
    zip: c.address?.zip ?? '',
    notes: c.notes,
    avatar: c.avatar ?? '',
  };
}

export function toCustomerInput(f: CustomerForm): CustomerInput {
  return {
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    email: f.email.trim(),
    phone: f.phone.trim(),
    company: f.company.trim(),
    status: f.status,
    address: { street: f.street.trim(), city: f.city.trim(), state: f.state.trim(), zip: f.zip.trim() },
    notes: f.notes.trim(),
    avatar: f.avatar,
  };
}

export function validateCustomer(f: CustomerForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!f.firstName.trim()) errors.firstName = 'First name is required';
  if (!f.lastName.trim()) errors.lastName = 'Last name is required';
  if (!f.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = 'Enter a valid email address';
  if (f.phone && !/^[\d\s()+\-.]*$/.test(f.phone)) errors.phone = 'Phone can only contain digits, spaces and + - ( ) .';
  return errors;
}
