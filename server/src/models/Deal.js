import mongoose from 'mongoose';
import { addressSchema, ownerField, schemaOptions } from './shared.js';

export const DEAL_STAGES = ['lead', 'qualified', 'proposal', 'won', 'lost'];
export const CLOSED_STAGES = ['won', 'lost'];
export const ROOM_ACCESS = ['keys_with_doorman', 'keys_in_lockbox', 'customer_present', 'other'];

const dealSchema = new mongoose.Schema(
  {
    owner: ownerField,
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    title: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 },
    stage: { type: String, enum: DEAL_STAGES, default: 'lead' },
    expectedCloseDate: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    address: { type: addressSchema, default: () => ({}) },
    appointmentDate: { type: Date, default: null },
    roomArea: { type: Number, min: 0, default: null },
    people: { type: Number, min: 0, default: null },
    roomAccess: { type: String, enum: ROOM_ACCESS, default: 'keys_with_doorman' },
    instructions: { type: String, trim: true, default: '' },
    images: { type: [String], default: [] },
    thumbnail: { type: String, default: '' },
  },
  schemaOptions,
);

dealSchema.index({ owner: 1, stage: 1 });
dealSchema.index({ owner: 1, createdAt: -1 });
dealSchema.index({ owner: 1, appointmentDate: 1 });

export const Deal = mongoose.model('Deal', dealSchema);
