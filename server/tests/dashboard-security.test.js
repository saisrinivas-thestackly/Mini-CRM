import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { localRanges } from '../src/utils/dates.js';
import { clearTestDb, connectTestDb, disconnectTestDb } from './setup/db.js';
import { ORIGIN, createCustomer, createDeal, registerUser } from './setup/helpers.js';

const HOUR = 60 * 60 * 1000;

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

describe('Dashboard', () => {
  it('computes every number from the database', async () => {
    const { agent } = await registerUser(createApp());
    const c1 = await createCustomer(agent);
    await createCustomer(agent, { email: 'second@example.com' });
    await createDeal(agent, c1.id, { value: 1000, stage: 'lead' });
    await createDeal(agent, c1.id, { value: 2500, stage: 'proposal' });
    await createDeal(agent, c1.id, { value: 4000, stage: 'won' });
    await createDeal(agent, c1.id, { value: 900, stage: 'lost' });
    await agent.post('/api/tasks').send({ title: 'Late', dueDate: new Date(Date.now() - 48 * HOUR).toISOString() });
    await agent.post('/api/tasks').send({ title: 'Done late', dueDate: new Date(Date.now() - 48 * HOUR).toISOString(), done: true });

    const res = await agent.get('/api/dashboard/summary?tzOffset=-330');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalCustomers: 2,
      totalDeals: 4,
      openPipelineValue: 3500,
      dealsWonThisMonth: { count: 1, value: 4000 },
      overdueTasks: 1,
    });
    expect(res.body.pipelineByStage.find((s) => s.stage === 'proposal')).toEqual({ stage: 'proposal', count: 1, value: 2500 });
  });

  it("uses the user's timezone for day boundaries", () => {
    const { dayStart, monthStart } = localRanges(new Date('2026-10-01T20:00:00Z'), -330);
    expect(dayStart.toISOString()).toBe('2026-10-01T18:30:00.000Z');
    expect(monthStart.toISOString()).toBe('2026-09-30T18:30:00.000Z');
  });
});

describe('Security middleware', () => {
  it('answers a blocked CORS origin with 403, not 500', async () => {
    const res = await request(createApp()).get('/api/health').set('Origin', 'https://evil.example.com');
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/CORS/);
  });

  it('allows the configured origin with credentials and sets helmet headers', async () => {
    const res = await request(createApp()).get('/api/health').set('Origin', ORIGIN);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(createApp())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(400);
  });

  it('rate-limits repeated login attempts', async () => {
    const app = createApp();
    let last;
    for (let i = 0; i < 11; i += 1) {
      last = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'wrong' });
    }
    expect(last.status).toBe(429);
  });

  it('rate-limits registrations even when every one succeeds', async () => {
    const app = createApp();
    let last;
    for (let i = 0; i < 11; i += 1) {
      last = await request(app)
        .post('/api/auth/register')
        .send({ name: `User ${i}`, email: `limit-${i}-${Date.now()}@example.com`, password: 'Password123!' });
      if (i < 10) expect(last.status).toBe(201);
    }
    expect(last.status).toBe(429);
  });

  it('does not count successful logins toward the limit', async () => {
    const app = createApp();
    const { credentials } = await registerUser(app);
    const { email, password } = credentials;
    for (let i = 0; i < 12; i += 1) {
      const res = await request(app).post('/api/auth/login').send({ email, password });
      expect(res.status).toBe(200);
    }
  });
});
