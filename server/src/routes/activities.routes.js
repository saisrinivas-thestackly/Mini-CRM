import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { Activity } from '../models/Activity.js';
import { Deal } from '../models/Deal.js';
import { assertOwned, findOwned } from '../utils/ownership.js';
import { paginate } from '../utils/query.js';
import { idParams } from '../validation/common.js';
import { activityCreateBody, activityListQuery, activityUpdateBody } from '../validation/schemas.js';

export const dealActivitiesRouter = Router({ mergeParams: true });

dealActivitiesRouter.get('/', validate({ params: idParams, query: activityListQuery }), async (req, res) => {
  const owner = req.user.id;
  const dealId = req.valid.params.id;
  await assertOwned(Deal, dealId, owner, 'Deal');
  const { page, limit } = req.valid.query;
  res.json(await paginate(Activity, { owner, deal: dealId }, { page, limit, sort: '-date' }));
});

dealActivitiesRouter.post('/', validate({ params: idParams, body: activityCreateBody }), async (req, res) => {
  const owner = req.user.id;
  const dealId = req.valid.params.id;
  await assertOwned(Deal, dealId, owner, 'Deal');
  const { description, date = new Date(), images = [] } = req.valid.body;
  const activity = await Activity.create({ owner, deal: dealId, description, date, images });
  res.status(201).json({ activity });
});

export const activitiesRouter = Router();

activitiesRouter.patch('/:id', validate({ params: idParams, body: activityUpdateBody }), async (req, res) => {
  const activity = await findOwned(Activity, req.valid.params.id, req.user.id, 'Activity');
  activity.set(req.valid.body);
  await activity.save();
  res.json({ activity });
});

activitiesRouter.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const activity = await findOwned(Activity, req.valid.params.id, req.user.id, 'Activity');
  await activity.deleteOne();
  res.status(204).end();
});
