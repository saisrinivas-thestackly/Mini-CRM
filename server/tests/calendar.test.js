import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { clearTestDb, connectTestDb, disconnectTestDb } from './setup/db.js';
import { createCustomer, createDeal, registerUser } from './setup/helpers.js';

const DAY = 24 * 60 * 60 * 1000;

describe('Calendar', () => {
  let app;
  let agent;
  const now = Date.now();
  const from = new Date(now - DAY).toISOString();
  const to = new Date(now + 7 * DAY).toISOString();
  const range = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    await clearTestDb();
    app = createApp();
    agent = (await registerUser(app)).agent;
  });

  it('requires a session', async () => {
    const res = await request(app).get(`/api/calendar?${range}`);
    expect(res.status).toBe(401);
  });

  it('returns tasks, appointments and expected closes inside the range, in date order', async () => {
    const customer = await createCustomer(agent);
    await createDeal(agent, customer.id, {
      title: 'In range',
      appointmentDate: new Date(now + 2 * DAY).toISOString(),
      expectedCloseDate: new Date(now + 5 * DAY).toISOString(),
    });
    await createDeal(agent, customer.id, { title: 'Out of range', appointmentDate: new Date(now + 30 * DAY).toISOString() });
    await agent.post('/api/tasks').send({ title: 'Call back', dueDate: new Date(now + DAY).toISOString() });
    await agent.post('/api/tasks').send({ title: 'Much later', dueDate: new Date(now + 40 * DAY).toISOString() });

    const res = await agent.get(`/api/calendar?${range}`);
    expect(res.status).toBe(200);
    expect(res.body.events.map((e) => [e.type, e.title])).toEqual([
      ['task', 'Call back'],
      ['appointment', 'In range'],
      ['close', 'In range'],
    ]);
    expect(res.body.events[0]).toMatchObject({ done: false, overdue: false });
  });

  it("never includes another user's events", async () => {
    const customer = await createCustomer(agent);
    await createDeal(agent, customer.id, { appointmentDate: new Date(now + DAY).toISOString() });
    await agent.post('/api/tasks').send({ title: 'Private', dueDate: new Date(now + DAY).toISOString() });

    const other = (await registerUser(app)).agent;
    const res = await other.get(`/api/calendar?${range}`);
    expect(res.status).toBe(200);
    expect(res.body.events).toEqual([]);
  });

  it('rejects a missing, reversed or oversized range with 400', async () => {
    expect((await agent.get('/api/calendar')).status).toBe(400);
    expect((await agent.get('/api/calendar?from=nope&to=nope')).status).toBe(400);
    expect((await agent.get(`/api/calendar?from=${encodeURIComponent(to)}&to=${encodeURIComponent(from)}`)).status).toBe(400);
    const far = new Date(now + 200 * DAY).toISOString();
    expect((await agent.get(`/api/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(far)}`)).status).toBe(400);
  });
});
