import request from 'supertest';
import { createApp } from '../../src/app.js';

export const ORIGIN = 'https://crm.example.com';

let counter = 0;

export async function registerUser(app = createApp(), overrides = {}) {
  counter += 1;
  const agent = request.agent(app);
  const body = {
    name: `User ${counter}`,
    email: `user${counter}-${Date.now()}@example.com`,
    password: 'Password123!',
    ...overrides,
  };
  const res = await agent.post('/api/auth/register').set('Origin', ORIGIN).send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.user, credentials: body, res };
}

export async function createCustomer(agent, overrides = {}) {
  const res = await agent.post('/api/customers').send({
    firstName: 'Deanna',
    lastName: 'Annis',
    email: 'deanna@example.com',
    status: 'active',
    ...overrides,
  });
  if (res.status !== 201) throw new Error(`customer create failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.customer;
}

export async function createDeal(agent, customerId, overrides = {}) {
  const res = await agent.post('/api/deals').send({
    customer: customerId,
    title: '319 Haul Road',
    value: 5750,
    ...overrides,
  });
  if (res.status !== 201) throw new Error(`deal create failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.deal;
}
