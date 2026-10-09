import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { Task } from '../models/Task.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { localRanges } from '../utils/dates.js';
import { assertOwned, findOwned } from '../utils/ownership.js';
import { escapeRegex, paginate } from '../utils/query.js';
import { idParams } from '../validation/common.js';
import { taskCreateBody, taskListQuery, taskUpdateBody } from '../validation/schemas.js';

const POPULATE = [
  { path: 'customer', select: 'firstName lastName email avatar' },
  { path: 'deal', select: 'title stage' },
];

export const tasksRouter = Router();

async function resolveLinks(owner, customerId, dealId) {
  if (dealId) {
    const deal = await Deal.findOne({ _id: dealId, owner }).select('customer');
    if (!deal) throw notFound('Deal not found');
    if (customerId && String(deal.customer) !== String(customerId)) {
      throw badRequest('The selected deal belongs to a different customer');
    }
    return { customer: deal.customer, deal: deal._id };
  }
  await assertOwned(Customer, customerId, owner, 'Customer');
  return { customer: customerId ?? null, deal: null };
}

function statusFilter(status, tzOffset) {
  const now = new Date();
  switch (status) {
    case 'open':
      return { done: false };
    case 'done':
      return { done: true };
    case 'overdue':
      return { done: false, dueDate: { $lt: now } };
    case 'today': {
      const { dayStart, dayEnd } = localRanges(now, tzOffset);
      return { done: false, dueDate: { $gte: dayStart, $lt: dayEnd } };
    }
    case 'upcoming':
      return { done: false, dueDate: { $gte: now } };
    default:
      return {};
  }
}

tasksRouter.get('/', validate({ query: taskListQuery }), async (req, res) => {
  const { page, limit, search, status, priority, customer, deal, sort, tzOffset } = req.valid.query;
  const filter = { owner: req.user.id, ...statusFilter(status, tzOffset) };
  if (priority) filter.priority = priority;
  if (customer) filter.customer = customer;
  if (deal) filter.deal = deal;
  if (search) filter.title = new RegExp(escapeRegex(search), 'i');
  res.json(await paginate(Task, filter, { page, limit, sort, populate: POPULATE }));
});

tasksRouter.post('/', validate({ body: taskCreateBody }), async (req, res) => {
  const owner = req.user.id;
  const { customer, deal, ...body } = req.valid.body;
  const links = await resolveLinks(owner, customer, deal);
  const task = await Task.create({
    ...body,
    ...links,
    owner,
    completedAt: body.done ? new Date() : null,
  });
  await task.populate(POPULATE);
  res.status(201).json({ task });
});

tasksRouter.get('/:id', validate({ params: idParams }), async (req, res) => {
  const task = await findOwned(Task, req.valid.params.id, req.user.id, 'Task', POPULATE);
  res.json({ task });
});

tasksRouter.patch('/:id', validate({ params: idParams, body: taskUpdateBody }), async (req, res) => {
  const owner = req.user.id;
  const task = await findOwned(Task, req.valid.params.id, owner, 'Task');
  const { customer, deal, ...body } = req.valid.body;

  if (customer !== undefined || deal !== undefined) {
    const nextCustomer = customer !== undefined ? customer : task.customer;
    let nextDeal = deal !== undefined ? deal : task.deal;
    if (deal === undefined && customer !== undefined && task.deal) {
      const current = await Deal.findOne({ _id: task.deal, owner }).select('customer');
      if (!current || String(current.customer) !== String(customer)) nextDeal = null;
    }
    Object.assign(task, await resolveLinks(owner, nextCustomer, nextDeal));
  }

  if (body.done !== undefined && body.done !== task.done) {
    task.completedAt = body.done ? new Date() : null;
  }
  task.set(body);
  await task.save();
  await task.populate(POPULATE);
  res.json({ task });
});

tasksRouter.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const task = await findOwned(Task, req.valid.params.id, req.user.id, 'Task');
  await task.deleteOne();
  res.status(204).end();
});
