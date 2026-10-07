import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { Activity } from '../models/Activity.js';
import { Customer } from '../models/Customer.js';
import { Deal } from '../models/Deal.js';
import { Task } from '../models/Task.js';
import { findOwned } from '../utils/ownership.js';
import { escapeRegex, paginate } from '../utils/query.js';
import { idParams } from '../validation/common.js';
import { customerCreateBody, customerListQuery, customerUpdateBody } from '../validation/schemas.js';

export const customersRouter = Router();

customersRouter.get('/', validate({ query: customerListQuery }), async (req, res) => {
  const { page, limit, search, status, sort } = req.valid.query;
  const filter = { owner: req.user.id };
  if (status) filter.status = status;
  if (search) {
    filter.$and = search
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5)
      .map((word) => {
        const rx = new RegExp(escapeRegex(word), 'i');
        return { $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { company: rx }, { phone: rx }] };
      });
  }
  res.json(await paginate(Customer, filter, { page, limit, sort }));
});

customersRouter.post('/', validate({ body: customerCreateBody }), async (req, res) => {
  const customer = await Customer.create({ ...req.valid.body, owner: req.user.id });
  res.status(201).json({ customer });
});

customersRouter.get('/:id', validate({ params: idParams }), async (req, res) => {
  const customer = await findOwned(Customer, req.valid.params.id, req.user.id, 'Customer');
  const [dealCount, openTaskCount] = await Promise.all([
    Deal.countDocuments({ owner: req.user.id, customer: customer._id }),
    Task.countDocuments({ owner: req.user.id, customer: customer._id, done: false }),
  ]);
  res.json({ customer, stats: { dealCount, openTaskCount } });
});

customersRouter.patch('/:id', validate({ params: idParams, body: customerUpdateBody }), async (req, res) => {
  const customer = await findOwned(Customer, req.valid.params.id, req.user.id, 'Customer');
  const { address, ...rest } = req.valid.body;
  customer.set(rest);
  if (address) customer.address = { ...customer.address?.toObject?.(), ...address };
  await customer.save();
  res.json({ customer });
});

customersRouter.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const owner = req.user.id;
  const customer = await findOwned(Customer, req.valid.params.id, owner, 'Customer');
  const dealIds = await Deal.find({ owner, customer: customer._id }).distinct('_id');

  await Promise.all([
    Activity.deleteMany({ owner, deal: { $in: dealIds } }),
    Task.deleteMany({ owner, $or: [{ customer: customer._id }, { deal: { $in: dealIds } }] }),
    Deal.deleteMany({ owner, customer: customer._id }),
  ]);
  await customer.deleteOne();
  res.status(204).end();
});
