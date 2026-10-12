import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { clearTestDb, connectTestDb, disconnectTestDb } from './setup/db.js';
import { createCustomer, createDeal, registerUser } from './setup/helpers.js';

const DAY = 24 * 60 * 60 * 1000;

describe('Deals pipeline and tasks', () => {
  let agent;
  let customer;
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(async () => {
    await clearTestDb();
    agent = (await registerUser(createApp())).agent;
    customer = await createCustomer(agent);
  });

  it('persists a stage change from the board and tracks when a deal closed', async () => {
    const deal = await createDeal(agent, customer.id, { stage: 'qualified' });
    expect(deal.customer.firstName).toBe('Deanna');

    const moved = await agent.patch(`/api/deals/${deal.id}/stage`).send({ stage: 'won' });
    expect(moved.status).toBe(200);
    expect(moved.body.deal.closedAt).toBeTruthy();

    const board = await agent.get('/api/deals/pipeline');
    const won = board.body.stages.find((s) => s.stage === 'won');
    expect(won).toMatchObject({ count: 1, value: 5750 });
    expect(won.deals[0].id).toBe(deal.id);

    const reopened = await agent.patch(`/api/deals/${deal.id}/stage`).send({ stage: 'proposal' });
    expect(reopened.body.deal.closedAt).toBeNull();

    const invalid = await agent.patch(`/api/deals/${deal.id}/stage`).send({ stage: 'maybe' });
    expect(invalid.status).toBe(400);
  });

  it('lists only open deals when open=true', async () => {
    await createDeal(agent, customer.id, { title: 'Lead deal', stage: 'lead' });
    await createDeal(agent, customer.id, { title: 'Won deal', stage: 'won' });
    await createDeal(agent, customer.id, { title: 'Lost deal', stage: 'lost' });

    const res = await agent.get('/api/deals?open=true&sort=-updatedAt');
    expect(res.status).toBe(200);
    expect(res.body.data.map((d) => d.title)).toEqual(['Lead deal']);
    expect((await agent.get('/api/deals?open=maybe')).status).toBe(400);
  });

  it('records, edits and deletes deal activities', async () => {
    const deal = await createDeal(agent, customer.id);
    const created = await agent.post(`/api/deals/${deal.id}/activities`).send({ description: 'Site visit' });
    expect(created.status).toBe(201);
    const id = created.body.activity.id;
    expect((await agent.patch(`/api/activities/${id}`).send({ description: 'Site visit done' })).body.activity.description).toBe('Site visit done');
    const list = await agent.get(`/api/deals/${deal.id}/activities`);
    expect(list.body.total).toBe(1);
    expect((await agent.delete(`/api/activities/${id}`)).status).toBe(204);
  });

  it('calculates "overdue" from the due date and does not accept it as input', async () => {
    const past = await agent.post('/api/tasks').send({ title: 'Old', dueDate: new Date(Date.now() - DAY).toISOString() });
    const future = await agent.post('/api/tasks').send({ title: 'New', dueDate: new Date(Date.now() + DAY).toISOString() });
    expect(past.body.task.overdue).toBe(true);
    expect(future.body.task.overdue).toBe(false);

    const overdueList = await agent.get('/api/tasks?status=overdue');
    expect(overdueList.body.data.map((t) => t.title)).toEqual(['Old']);

    const done = await agent.patch(`/api/tasks/${past.body.task.id}`).send({ done: true });
    expect(done.body.task.overdue).toBe(false);
    expect(done.body.task.completedAt).toBeTruthy();

    const manual = await agent.post('/api/tasks').send({ title: 'x', dueDate: '2030-01-01', overdue: true });
    expect(manual.status).toBe(400);
  });

  it('links a task to a deal and its customer, rejecting mismatches', async () => {
    const other = await createCustomer(agent, { firstName: 'Other', email: 'o@example.com' });
    const deal = await createDeal(agent, customer.id);
    const task = await agent.post('/api/tasks').send({ title: 'Quote', dueDate: '2030-01-01', deal: deal.id });
    expect(task.body.task.customer.id).toBe(customer.id);

    const mismatch = await agent.post('/api/tasks').send({ title: 'Quote', dueDate: '2030-01-01', deal: deal.id, customer: other.id });
    expect(mismatch.status).toBe(400);

    const byCustomer = await agent.get(`/api/tasks?customer=${customer.id}`);
    expect(byCustomer.body.total).toBe(1);
  });
  it('filters tasks due today in the user timezone', async () => {
    const today = new Date();
    today.setHours(23, 0, 0, 0);
    await agent.post('/api/tasks').send({ title: 'Today', dueDate: today.toISOString(), customer: customer.id });
    await agent.post('/api/tasks').send({ title: 'Later', dueDate: new Date(Date.now() + 3 * DAY).toISOString(), customer: customer.id });
    const res = await agent.get(`/api/tasks?status=today&tzOffset=${today.getTimezoneOffset()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((t) => t.title)).toEqual(['Today']);
  });

  it('stores room images on a deal, validates them and keeps them out of list responses', async () => {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAwS2OUAAAAABJRU5ErkJggg==';
    const bad = await agent.post('/api/deals').send({ customer: customer.id, title: 'Img', value: 10, images: ['javascript:alert(1)'] });
    expect(bad.status).toBe(400);

    const created = await agent.post('/api/deals').send({ customer: customer.id, title: 'Img', value: 10, images: [png], thumbnail: png });
    expect(created.status).toBe(201);
    const detail = await agent.get(`/api/deals/${created.body.deal.id}`);
    expect(detail.body.deal.images).toEqual([png]);

    const activity = await agent.post(`/api/deals/${created.body.deal.id}/activities`).send({ description: 'Visit', images: [png] });
    expect(activity.body.activity.images).toEqual([png]);

    const list = await agent.get('/api/deals');
    expect(list.body.data[0].images).toBeUndefined();
    expect(list.body.data[0].thumbnail).toBe(png);
  });
});
