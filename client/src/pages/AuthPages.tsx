import { useMutation } from '@tanstack/react-query';
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Logo } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Field, FormError, Input } from '../components/ui/Form';
import { PageLoader } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { ApiError, errorMessage } from '../lib/api';
import { authApi } from '../lib/services';

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 flex items-center gap-3">
          <Logo />
          <span className="text-xl font-bold text-navy">Mini CRM</span>
        </div>
        <div className="card p-6 sm:p-9">
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          <p className="mt-1 mb-7 text-muted">{subtitle}</p>
          {children}
        </div>
        <p className="mt-6 text-center text-[15px] text-muted">{footer}</p>
      </div>
    </main>
  );
}

function useRedirectTarget() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return from && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login') ? from : '/';
}

export function LoginPage() {
  const { user, checking, setUser } = useAuth();
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (u) => {
      setUser(u);
      navigate(target, { replace: true });
    },
    onError: (err) => err instanceof ApiError && setErrors(err.fieldErrors),
  });

  if (checking) return <PageLoader />;
  if (user) return <Navigate to={target} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Email is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    if (!Object.keys(next).length) login.mutate({ email: email.trim(), password });
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your customers and deals."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <FormError message={login.isError ? errorMessage(login.error) : null} />
        <Field label="Email" htmlFor="login-email" error={errors.email}>
          <Input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="login-password" error={errors.password}>
          <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          {login.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { user, checking, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (u) => {
      setUser(u);
      navigate('/', { replace: true });
    },
    onError: (err) => err instanceof ApiError && setErrors(err.fieldErrors),
  });

  if (checking) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (!Object.keys(next).length) register.mutate({ name: form.name.trim(), email: form.email.trim(), password: form.password });
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start tracking customers, deals and tasks."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <FormError message={register.isError ? errorMessage(register.error) : null} />
        <Field label="Full name" htmlFor="reg-name" error={errors.name}>
          <Input id="reg-name" autoComplete="name" value={form.name} onChange={set('name')} invalid={!!errors.name} />
        </Field>
        <Field label="Email" htmlFor="reg-email" error={errors.email}>
          <Input id="reg-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="reg-password" error={errors.password} hint="At least 8 characters.">
          <Input id="reg-password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} invalid={!!errors.password} />
        </Field>
        <Field label="Confirm password" htmlFor="reg-confirm" error={errors.confirm}>
          <Input id="reg-confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} invalid={!!errors.confirm} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={register.isPending}>
          {register.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
