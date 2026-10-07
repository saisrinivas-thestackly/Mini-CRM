import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { AUTH_COOKIE, cookieOptions, requireAuth, signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { User } from '../models/User.js';
import { badRequest, conflict, unauthorized } from '../utils/httpError.js';
import { changePasswordBody, loginBody, registerBody } from '../validation/schemas.js';

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

function setSession(res, userId) {
  res.cookie(AUTH_COOKIE, signToken(userId), cookieOptions());
}

export function authRouter({ authLimiter, registerLimiter }) {
  const router = Router();

  router.post('/register', registerLimiter, validate({ body: registerBody }), async (req, res) => {
    const { name, email, password } = req.valid.body;
    if (await User.exists({ email })) throw conflict('An account with this email already exists');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ name, email, passwordHash });
    setSession(res, user._id);
    res.status(201).json({ user });
  });

  router.post('/login', authLimiter, validate({ body: loginBody }), async (req, res) => {
    const { email, password } = req.valid.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw unauthorized('Incorrect email or password');

    setSession(res, user._id);
    res.json({ user });
  });

  router.post('/logout', (_req, res) => {
    const { maxAge: _maxAge, ...opts } = cookieOptions();
    res.clearCookie(AUTH_COOKIE, opts);
    res.status(204).end();
  });

  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  router.patch('/password', authLimiter, requireAuth, validate({ body: changePasswordBody }), async (req, res) => {
    const { currentPassword, newPassword } = req.valid.body;
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw badRequest('Current password is incorrect');
    }
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.save();
    setSession(res, user._id);
    res.json({ message: 'Password updated' });
  });

  return router;
}
