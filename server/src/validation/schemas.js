import { z } from 'zod';
import { CUSTOMER_STATUSES } from '../models/Customer.js';
import { DEAL_STAGES, ROOM_ACCESS } from '../models/Deal.js';
import { TASK_PRIORITIES } from '../models/Task.js';
import {
  addressBody,
  imageData,
  imageList,
  nullableDate,
  objectId,
  optionalQuery,
  paginationQuery,
  requiredDate,
  requiredText,
  trimmed,
} from './common.js';

const email = z.email('Enter a valid email address').trim().toLowerCase().max(254);
const password = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const registerBody = z.strictObject({
  name: requiredText(80, 'Name'),
  email,
  password,
});

export const loginBody = z.strictObject({
  email,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(72),
});

export const changePasswordBody = z.strictObject({
  currentPassword: z.string({ error: 'Current password is required' }).min(1, 'Current password is required').max(72),
  newPassword: password,
});

const customerFields = {
  firstName: requiredText(60, 'First name'),
  lastName: requiredText(60, 'Last name'),
  company: trimmed(120, 'Company').optional(),
  email,
  phone: trimmed(30, 'Phone')
    .regex(/^[\d\s()+\-.]*$/, 'Phone can only contain digits, spaces and + - ( ) .')
    .optional(),
  status: z.enum(CUSTOMER_STATUSES, { error: `Status must be one of: ${CUSTOMER_STATUSES.join(', ')}` }).optional(),
  address: addressBody.optional(),
  notes: trimmed(2000, 'Notes').optional(),
  avatar: z.union([z.literal(''), imageData(80_000, 'Avatar')]).optional(),
};

export const customerCreateBody = z.strictObject(customerFields);
export const customerUpdateBody = z
  .strictObject(customerFields)
  .partial()
  .refine((b) => Object.keys(b).length > 0, 'Provide at least one field to update');

export const customerListQuery = z.strictObject({
  ...paginationQuery,
  status: optionalQuery(z.enum(CUSTOMER_STATUSES)),
  sort: optionalQuery(z.enum(['createdAt', '-createdAt', 'firstName', '-firstName', 'lastName', '-lastName'])).default('-createdAt'),
});

const stage = z.enum(DEAL_STAGES, { error: `Stage must be one of: ${DEAL_STAGES.join(', ')}` });

const dealFields = {
  customer: objectId,
  title: requiredText(160, 'Title'),
  value: z.coerce.number({ error: 'Value must be a number' }).min(0, 'Value cannot be negative').max(1e10),
  stage: stage.optional(),
  expectedCloseDate: nullableDate('Expected close date').optional(),
  address: addressBody.optional(),
  appointmentDate: nullableDate('Appointment date').optional(),
  roomArea: z.union([z.null(), z.coerce.number().min(0, 'Room area cannot be negative').max(1e6)]).optional(),
  people: z.union([z.null(), z.coerce.number().int('People must be a whole number').min(0).max(10000)]).optional(),
  roomAccess: z.enum(ROOM_ACCESS).optional(),
  instructions: trimmed(2000, 'Special instructions').optional(),
  images: imageList(4, 'Room image').optional(),
  thumbnail: z.union([z.literal(''), imageData(40_000, 'Thumbnail')]).optional(),
};

export const dealCreateBody = z.strictObject(dealFields);
export const dealUpdateBody = z
  .strictObject(dealFields)
  .partial()
  .refine((b) => Object.keys(b).length > 0, 'Provide at least one field to update');
export const dealStageBody = z.strictObject({ stage });

export const dealListQuery = z.strictObject({
  ...paginationQuery,
  stage: optionalQuery(stage),
  customer: optionalQuery(objectId),
  sort: optionalQuery(
    z.enum(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'value', '-value', 'appointmentDate', '-appointmentDate', 'expectedCloseDate', '-expectedCloseDate']),
  ).default('-createdAt'),
  upcoming: optionalQuery(z.enum(['true', 'false'])),
  open: optionalQuery(z.enum(['true', 'false'])),
});

export const pipelineQuery = z.strictObject({
  search: optionalQuery(z.string().trim().max(100)),
  customer: optionalQuery(objectId),
});

export const activityCreateBody = z.strictObject({
  description: requiredText(500, 'Description'),
  date: requiredDate('Date').optional(),
  images: imageList(2, 'Activity image').optional(),
});
export const activityUpdateBody = activityCreateBody
  .partial()
  .refine((b) => Object.keys(b).length > 0, 'Provide at least one field to update');
export const activityListQuery = z.strictObject({
  page: paginationQuery.page,
  limit: paginationQuery.limit,
});

const taskFields = {
  title: requiredText(200, 'Title'),
  description: trimmed(2000, 'Description').optional(),
  dueDate: requiredDate('Due date'),
  priority: z.enum(TASK_PRIORITIES, { error: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}` }).optional(),
  done: z.boolean({ error: 'Done must be true or false' }).optional(),
  customer: z.union([z.null(), objectId]).optional(),
  deal: z.union([z.null(), objectId]).optional(),
};

export const taskCreateBody = z.strictObject(taskFields);
export const taskUpdateBody = z
  .strictObject(taskFields)
  .partial()
  .refine((b) => Object.keys(b).length > 0, 'Provide at least one field to update');

export const taskListQuery = z.strictObject({
  ...paginationQuery,
  status: optionalQuery(z.enum(['open', 'done', 'overdue', 'upcoming', 'today'])),
  tzOffset: optionalQuery(z.coerce.number().int().min(-840).max(840)).default(0),
  priority: optionalQuery(z.enum(TASK_PRIORITIES)),
  customer: optionalQuery(objectId),
  deal: optionalQuery(objectId),
  sort: optionalQuery(z.enum(['dueDate', '-dueDate', 'createdAt', '-createdAt'])).default('dueDate'),
});

export const dashboardQuery = z.strictObject({
  tzOffset: optionalQuery(z.coerce.number().int().min(-840).max(840)).default(0),
});

const MAX_CALENDAR_RANGE_MS = 62 * 24 * 60 * 60 * 1000;

export const calendarQuery = z
  .strictObject({
    from: requiredDate('from'),
    to: requiredDate('to'),
  })
  .refine((q) => q.to > q.from, 'to must be after from')
  .refine((q) => q.to - q.from <= MAX_CALENDAR_RANGE_MS, 'Date range cannot be longer than 62 days');
