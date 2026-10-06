import mongoose from 'mongoose';
import { ownerField, schemaOptions } from './shared.js';

const activitySchema = new mongoose.Schema(
  {
    owner: ownerField,
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true, index: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    images: { type: [String], default: [] },
  },
  schemaOptions,
);

activitySchema.index({ owner: 1, deal: 1, date: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
