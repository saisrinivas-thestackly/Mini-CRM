import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { Deal } from '../models/Deal.js';
import { Task } from '../models/Task.js';
import { calendarQuery } from '../validation/schemas.js';

const PER_TYPE_LIMIT = 200;

export const calendarRouter = Router();

calendarRouter.get('/', validate({ query: calendarQuery }), async (req, res) => {
  const owner = req.user.id;
  const { from, to } = req.valid.query;
  const range = { $gte: from, $lt: to };

  const [tasks, appointments, closing] = await Promise.all([
    Task.find({ owner, dueDate: range }).sort({ dueDate: 1 }).limit(PER_TYPE_LIMIT).select('title dueDate done priority'),
    Deal.find({ owner, appointmentDate: range }).sort({ appointmentDate: 1 }).limit(PER_TYPE_LIMIT).select('title appointmentDate stage'),
    Deal.find({ owner, expectedCloseDate: range }).sort({ expectedCloseDate: 1 }).limit(PER_TYPE_LIMIT).select('title expectedCloseDate stage'),
  ]);

  const events = [
    ...tasks.map((t) => ({
      id: `task-${t._id}`,
      type: 'task',
      refId: String(t._id),
      title: t.title,
      date: t.dueDate,
      done: t.done,
      overdue: t.overdue,
      priority: t.priority,
    })),
    ...appointments.map((d) => ({
      id: `appointment-${d._id}`,
      type: 'appointment',
      refId: String(d._id),
      title: d.title,
      date: d.appointmentDate,
      stage: d.stage,
    })),
    ...closing.map((d) => ({
      id: `close-${d._id}`,
      type: 'close',
      refId: String(d._id),
      title: d.title,
      date: d.expectedCloseDate,
      stage: d.stage,
    })),
  ].sort((a, b) => a.date - b.date);

  res.json({ events });
});
