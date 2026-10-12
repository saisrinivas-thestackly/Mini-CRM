import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { clearTestDb, connectTestDb, disconnectTestDb } from './setup/db.js';
import { createCustomer, createDeal, registerUser } from './setup/helpers.js';

describe('Data isolation between users', () => {
  let alice;
  let bob;
  let aliceCustomer;
  let aliceDeal;
  let aliceTask;

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    await clearTestDb();
    const app = createApp();
    alice = (await registerUser(app)).agent;
    bob = (await registerUser(app)).agent;
    aliceCustomer = await createCustomer(alice);
    aliceDeal = await createDeal(alice, aliceCustomer.id);
    aliceTask = (await alice.post('/api/tasks').send({ title: 'Call', dueDate: new Date().toISOString(), customer: aliceCustomer.id })).body.task;
  });

  it("returns 404 when a user reads, edits or deletes another user's customer", async () => {
    expect((await bob.get(`/api/customers/${aliceCustomer.id}`)).status).toBe(404);
    expect((await bob.patch(`/api/customers/${aliceCustomer.id}`).send({ firstName: 'Hacked' })).status).toBe(404);
    expect((await bob.delete(`/api/customers/${aliceCustomer.id}`)).status).toBe(404);

    const stillThere = await alice.get(`/api/customers/${aliceCustomer.id}`);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.customer.firstName).toBe('Deanna');
  });

  it("returns 404 for another user's deals, stage changes, activities and tasks", async () => {
    expect((await bob.get(`/api/deals/${aliceDeal.id}`)).status).toBe(404);
    expect((await bob.patch(`/api/deals/${aliceDeal.id}/stage`).send({ stage: 'won' })).status).toBe(404);
    expect((await bob.get(`/api/deals/${aliceDeal.id}/activities`)).status).toBe(404);
    expect((await bob.post(`/api/deals/${aliceDeal.id}/activities`).send({ description: 'x' })).status).toBe(404);
    expect((await bob.patch(`/api/tasks/${aliceTask.id}`).send({ done: true })).status).toBe(404);
    expect((await bob.delete(`/api/tasks/${aliceTask.id}`)).status).toBe(404);
  });

  it("never lists another user's records or counts them on the dashboard", async () => {
    const [customers, deals, tasks, pipeline, summary] = await Promise.all([
      bob.get('/api/customers'),
      bob.get('/api/deals'),
      bob.get('/api/tasks'),
      bob.get('/api/deals/pipeline'),
      bob.get('/api/dashboard/summary'),
    ]);
    expect(customers.body.total).toBe(0);
    expect(deals.body.total).toBe(0);
    expect(tasks.body.total).toBe(0);
    expect(pipeline.body.stages.every((s) => s.deals.length === 0)).toBe(true);
    expect(summary.body.totalCustomers).toBe(0);
    expect(summary.body.openPipelineValue).toBe(0);
  });

  it("cannot link a deal or task to another user's customer", async () => {
    const deal = await bob.post('/api/deals').send({ customer: aliceCustomer.id, title: 'Sneaky', value: 10 });
    expect(deal.status).toBe(404);
    const task = await bob.post('/api/tasks').send({ title: 'Sneaky', dueDate: '2030-01-01', deal: aliceDeal.id });
    expect(task.status).toBe(404);
  });
});
