import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { clearTestDb, connectTestDb, disconnectTestDb } from './setup/db.js';
import { createCustomer, createDeal, registerUser } from './setup/helpers.js';

describe('Customers', () => {
  let agent;
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(async () => {
    await clearTestDb();
    agent = (await registerUser(createApp())).agent;
  });

  it('validates the body and returns 400 with a clear message', async () => {
    const res = await agent.post('/api/customers').send({ firstName: 'A', email: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['lastName', 'email']));

    const unknownField = await agent.post('/api/customers').send({ firstName: 'A', lastName: 'B', email: 'a@b.co', owner: 'x' });
    expect(unknownField.status).toBe(400);

    const badId = await agent.get('/api/customers/not-an-id');
    expect(badId.status).toBe(400);
  });

  it('searches, filters by status and paginates on the server', async () => {
    for (let i = 0; i < 12; i += 1) {
      await createCustomer(agent, { firstName: `Person${i}`, email: `p${i}@example.com`, status: i % 2 ? 'active' : 'lead' });
    }
    await createCustomer(agent, { firstName: 'Zelda', lastName: 'Unique', email: 'zelda@example.com', company: 'Hyrule' });

    const page1 = await agent.get('/api/customers?limit=5&page=1');
    expect(page1.body).toMatchObject({ total: 13, page: 1, limit: 5, totalPages: 3 });
    expect(page1.body.data).toHaveLength(5);
    const page3 = await agent.get('/api/customers?limit=5&page=3');
    expect(page3.body.data).toHaveLength(3);

    const active = await agent.get('/api/customers?status=active&limit=50');
    expect(active.body.total).toBe(7);
    expect(active.body.data.every((c) => c.status === 'active')).toBe(true);

    const search = await agent.get('/api/customers?search=hyrule');
    expect(search.body.data.map((c) => c.firstName)).toEqual(['Zelda']);

    const fullName = await agent.get('/api/customers?search=zelda%20unique');
    expect(fullName.body.data.map((c) => c.firstName)).toEqual(['Zelda']);

    const regexInjection = await agent.get('/api/customers?search=.*');
    expect(regexInjection.body.total).toBe(0);

    const badStatus = await agent.get('/api/customers?status=vip');
    expect(badStatus.status).toBe(400);
  });

  it('updates a customer and cascades deletes to their deals and tasks', async () => {
    const c = await createCustomer(agent);
    const updated = await agent.patch(`/api/customers/${c.id}`).send({ phone: '310-685-3335', address: { city: 'Boston' } });
    expect(updated.status).toBe(200);
    expect(updated.body.customer).toMatchObject({ phone: '310-685-3335', name: 'Deanna Annis' });
    expect(updated.body.customer.address.city).toBe('Boston');

    const deal = await createDeal(agent, c.id);
    await agent.post('/api/tasks').send({ title: 'Follow up', dueDate: '2030-01-01', deal: deal.id });

    expect((await agent.delete(`/api/customers/${c.id}`)).status).toBe(204);
    expect((await agent.get(`/api/deals/${deal.id}`)).status).toBe(404);
    expect((await agent.get('/api/tasks')).body.total).toBe(0);
  });
});
