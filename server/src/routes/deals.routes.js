import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { Activity } from '../models/Activity.js';
import { Customer } from '../models/Customer.js';
import { CLOSED_STAGES, DEAL_STAGES, Deal } from '../models/Deal.js';
import { Task } from '../models/Task.js';
import { assertOwned, findOwned } from '../utils/ownership.js';
import { escapeRegex, paginate, toObjectId } from '../utils/query.js';
import { idParams } from '../validation/common.js';
import {
  dealCreateBody,
  dealListQuery,
  dealStageBody,
  dealUpdateBody,
  pipelineQuery,
} from '../validation/schemas.js';

const CUSTOMER_FIELDS = 'firstName lastName email phone company status avatar';
const LIST_FIELDS = '-images';
const PIPELINE_COLUMN_LIMIT = 100;

export const dealsRouter = Router();

function searchFilter(search) {
  const rx = new RegExp(escapeRegex(search), 'i');
  return [{ title: rx }, { 'address.street': rx }, { 'address.city': rx }, { 'address.state': rx }];
}

function applyStage(deal, stage) {
  const wasClosed = CLOSED_STAGES.includes(deal.stage);
  const isClosed = CLOSED_STAGES.includes(stage);
  deal.stage = stage;
  if (isClosed && (!wasClosed || !deal.closedAt)) deal.closedAt = new Date();
  if (!isClosed) deal.closedAt = null;
}

dealsRouter.get('/', validate({ query: dealListQuery }), async (req, res) => {
  const { page, limit, search, stage, customer, sort, upcoming, open } = req.valid.query;
  const filter = { owner: req.user.id };
  if (stage) filter.stage = stage;
  if (customer) filter.customer = customer;
  if (search) filter.$or = searchFilter(search);
  if (open === 'true') filter.stage = filter.stage ?? { $nin: CLOSED_STAGES };
  if (upcoming === 'true') {
    filter.appointmentDate = { $gte: new Date() };
    filter.stage = filter.stage ?? { $nin: CLOSED_STAGES };
  }
  res.json(await paginate(Deal, filter, { page, limit, sort, populate: { path: 'customer', select: CUSTOMER_FIELDS }, select: LIST_FIELDS }));
});

dealsRouter.get('/pipeline', validate({ query: pipelineQuery }), async (req, res) => {
  const { search, customer } = req.valid.query;
  const match = { owner: toObjectId(req.user.id) };
  if (customer) match.customer = toObjectId(customer);
  if (search) match.$or = searchFilter(search);

  const [totals, deals] = await Promise.all([
    Deal.aggregate([
      { $match: match },
      { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
    ]),
    Deal.find(match)
      .sort({ updatedAt: -1 })
      .limit(PIPELINE_COLUMN_LIMIT * DEAL_STAGES.length)
      .select(LIST_FIELDS)
      .populate({ path: 'customer', select: CUSTOMER_FIELDS }),
  ]);

  const stages = DEAL_STAGES.map((stage) => {
    const total = totals.find((t) => t._id === stage);
    return {
      stage,
      count: total?.count ?? 0,
      value: total?.value ?? 0,
      deals: deals.filter((d) => d.stage === stage).slice(0, PIPELINE_COLUMN_LIMIT),
    };
  });
  res.json({ stages });
});

dealsRouter.post('/', validate({ body: dealCreateBody }), async (req, res) => {
  const owner = req.user.id;
  const { stage = 'lead', ...body } = req.valid.body;
  await assertOwned(Customer, body.customer, owner, 'Customer');

  const deal = new Deal({ ...body, owner });
  applyStage(deal, stage);
  await deal.save();
  await deal.populate({ path: 'customer', select: CUSTOMER_FIELDS });
  res.status(201).json({ deal });
});

dealsRouter.get('/:id', validate({ params: idParams }), async (req, res) => {
  const deal = await findOwned(Deal, req.valid.params.id, req.user.id, 'Deal', {
    path: 'customer',
    select: CUSTOMER_FIELDS,
  });
  res.json({ deal });
});

dealsRouter.patch('/:id', validate({ params: idParams, body: dealUpdateBody }), async (req, res) => {
  const owner = req.user.id;
  const deal = await findOwned(Deal, req.valid.params.id, owner, 'Deal');
  const { stage, address, ...rest } = req.valid.body;
  if (rest.customer) await assertOwned(Customer, rest.customer, owner, 'Customer');

  deal.set(rest);
  if (address) deal.address = { ...deal.address?.toObject?.(), ...address };
  if (stage) applyStage(deal, stage);
  await deal.save();
  await deal.populate({ path: 'customer', select: CUSTOMER_FIELDS });
  res.json({ deal });
});

dealsRouter.patch('/:id/stage', validate({ params: idParams, body: dealStageBody }), async (req, res) => {
  const deal = await findOwned(Deal, req.valid.params.id, req.user.id, 'Deal');
  applyStage(deal, req.valid.body.stage);
  await deal.save();
  await deal.populate({ path: 'customer', select: CUSTOMER_FIELDS });
  res.json({ deal });
});

dealsRouter.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const owner = req.user.id;
  const deal = await findOwned(Deal, req.valid.params.id, owner, 'Deal');
  await Promise.all([
    Activity.deleteMany({ owner, deal: deal._id }),
    Task.updateMany({ owner, deal: deal._id }, { $set: { deal: null } }),
  ]);
  await deal.deleteOne();
  res.status(204).end();
});
