import mongoose from 'mongoose';
import { ownerField, schemaOptions } from './shared.js';

export const TASK_PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    owner: ownerField,
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    done: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
  },
  schemaOptions,
);

taskSchema.virtual('overdue').get(function isOverdue() {
  return !this.done && this.dueDate instanceof Date && this.dueDate.getTime() < Date.now();
});

taskSchema.index({ owner: 1, done: 1, dueDate: 1 });

export const Task = mongoose.model('Task', taskSchema);
