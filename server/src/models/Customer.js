import mongoose from 'mongoose';
import { addressSchema, ownerField, schemaOptions } from './shared.js';

export const CUSTOMER_STATUSES = ['lead', 'active', 'inactive'];

const customerSchema = new mongoose.Schema(
  {
    owner: ownerField,
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    status: { type: String, enum: CUSTOMER_STATUSES, default: 'lead' },
    address: { type: addressSchema, default: () => ({}) },
    notes: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
  },
  schemaOptions,
);

customerSchema.virtual('name').get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

customerSchema.index({ owner: 1, createdAt: -1 });
customerSchema.index({ owner: 1, status: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
