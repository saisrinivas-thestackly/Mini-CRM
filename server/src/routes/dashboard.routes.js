import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { CUSTOMER_STATUSES, Customer } from '../models/Customer.js';
import { CLOSED_STAGES, DEAL_STAGES, Deal } from '../models/Deal.js';
import { Task } from '../models/Task.js';
import { localRanges } from '../utils/dates.js';
import { toObjectId } from '../utils/query.js';
import { dashboardQuery } from '../validation/schemas.js';

const countStage = [{ $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$value' } } }];

export const dashboardRouter = Router();

dashboardRouter.get('/summary', validate({ query: dashboardQuery }), async (req, res) => {
  const owner = toObjectId(req.user.id);
  const now = new Date();
  const { dayStart, dayEnd, monthStart, monthEnd } = localRanges(now, req.valid.query.tzOffset);

  const [customersByStatus, dealsByStage, wonThisMonth, dueToday, overdue] = await Promise.all([
    Customer.aggregate([{ $match: { owner } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Deal.aggregate([
      { $match: { owner } },
      { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
    ]),
    Deal.aggregate([
      { $match: { owner, stage: 'won', closedAt: { $gte: monthStart, $lt: monthEnd } } },
      ...countStage,
    ]),
    Task.aggregate([{ $match: { owner, done: false, dueDate: { $gte: dayStart, $lt: dayEnd } } }, ...countStage]),
    Task.aggregate([{ $match: { owner, done: false, dueDate: { $lt: now } } }, ...countStage]),
  ]);

  const pipelineByStage = DEAL_STAGES.map((stage) => {
    const row = dealsByStage.find((r) => r._id === stage);
    return { stage, count: row?.count ?? 0, value: row?.value ?? 0 };
  });
  const openStages = pipelineByStage.filter((s) => !CLOSED_STAGES.includes(s.stage));

  res.json({
    totalCustomers: customersByStatus.reduce((sum, r) => sum + r.count, 0),
    customersByStatus: CUSTOMER_STATUSES.map((status) => ({
      status,
      count: customersByStatus.find((r) => r._id === status)?.count ?? 0,
    })),
    totalDeals: pipelineByStage.reduce((sum, s) => sum + s.count, 0),
    openPipelineValue: openStages.reduce((sum, s) => sum + s.value, 0),
    openDealCount: openStages.reduce((sum, s) => sum + s.count, 0),
    dealsWonThisMonth: { count: wonThisMonth[0]?.count ?? 0, value: wonThisMonth[0]?.value ?? 0 },
    tasksDueToday: dueToday[0]?.count ?? 0,
    overdueTasks: overdue[0]?.count ?? 0,
    pipelineByStage,
    generatedAt: now.toISOString(),
  });
});
