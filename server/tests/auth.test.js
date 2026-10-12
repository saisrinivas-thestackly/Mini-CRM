import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { clearTestDb, connectTestDb, disconnectTestDb } from './setup/db.js';
import { registerUser } from './setup/helpers.js';

describe('Auth', () => {
  let app;
  beforeAll(async () => {
    await connectTestDb();
  });
  beforeEach(async () => {
    await clearTestDb();
    app = createApp();
  });
  afterAll(disconnectTestDb);

  it('registers a user and sets an httpOnly session cookie (no password in the response)', async () => {
    const { res } = await registerUser(app, { email: 'new@example.com' });
    expect(res.body.user).toMatchObject({ email: 'new@example.com' });
    expect(res.body.user.passwordHash).toBeUndefined();
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^token=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('restores the session with GET /api/auth/me and returns 401 without a cookie', async () => {
    const { agent, user } = await registerUser(app);
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(user.id);

    const anonymous = await request(app).get('/api/auth/me');
    expect(anonymous.status).toBe(401);
  });

  it('logs in with valid credentials and rejects a wrong password with 401', async () => {
    const { credentials } = await registerUser(app);
    const bad = await request(app).post('/api/auth/login').send({ email: credentials.email, password: 'wrong-password' });
    expect(bad.status).toBe(401);
    expect(bad.body.message).toBe('Incorrect email or password');

    const good = await request(app).post('/api/auth/login').send({ email: credentials.email, password: credentials.password });
    expect(good.status).toBe(200);
    expect(good.headers['set-cookie'][0]).toMatch(/^token=/);
  });

  it('logout clears the cookie so protected routes return 401', async () => {
    const { agent } = await registerUser(app);
    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(204);
    expect((await agent.get('/api/customers')).status).toBe(401);
  });

  it('rejects a duplicate email with 409 and invalid input with 400 (not 500)', async () => {
    const { credentials } = await registerUser(app);
    const dup = await request(app).post('/api/auth/register').send(credentials);
    expect(dup.status).toBe(409);

    const invalid = await request(app).post('/api/auth/register').send({ name: '', email: 'not-an-email', password: '123' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toMatch(/name|email|password/i);
    expect(invalid.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects a tampered token with 401', async () => {
    const res = await request(app).get('/api/customers').set('Cookie', 'token=not.a.valid.jwt');
    expect(res.status).toBe(401);
  });

  it('changes the password only when the current password is correct', async () => {
    const { agent, credentials } = await registerUser(app);
    const wrong = await agent.patch('/api/auth/password').send({ currentPassword: 'nope', newPassword: 'NewPassword456!' });
    expect(wrong.status).toBe(400);
    const ok = await agent.patch('/api/auth/password').send({ currentPassword: credentials.password, newPassword: 'NewPassword456!' });
    expect(ok.status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email: credentials.email, password: 'NewPassword456!' });
    expect(login.status).toBe(200);
  });
});
