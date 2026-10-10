import { useMutation } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Field, FormError, Input } from '../components/ui/Form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiError, errorMessage } from '../lib/api';
import { authApi } from '../lib/services';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const change = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.saved('Password Updated');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err) => err instanceof ApiError && setErrors(err.fieldErrors),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.currentPassword) next.currentPassword = 'Current password is required';
    if (form.newPassword.length < 8) next.newPassword = 'New password must be at least 8 characters';
    if (form.confirm !== form.newPassword) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (!Object.keys(next).length) change.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  const field = (key: keyof typeof form, label: string, autoComplete: string) => (
    <Field label={label} htmlFor={`pw-${key}`} error={errors[key]}>
      <Input
        id={`pw-${key}`}
        type="password"
        autoComplete={autoComplete}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        invalid={!!errors[key]}
        disabled={change.isPending}
      />
    </Field>
  );

  return (
    <>
      <PageHeader title="Settings" />
      <main className="max-w-2xl space-y-6 p-4 sm:p-6">
        <section className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar name={user?.name} size={64} />
            <div className="min-w-0 flex-1">
              <p className="text-lg leading-snug font-bold break-words text-navy sm:text-xl">{user?.name}</p>
              <p className="truncate text-muted">{user?.email}</p>
            </div>
          </div>
          <Button
            className="w-full shrink-0 sm:w-auto"
            variant="secondary"
            icon={<LogOut className="size-4" />}
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
          >
            Log out
          </Button>
        </section>

        <form onSubmit={submit} noValidate className="card space-y-5 p-6">
          <h2 className="text-lg font-bold text-navy">Change password</h2>
          <FormError message={change.isError ? errorMessage(change.error) : null} />
          {field('currentPassword', 'Current password', 'current-password')}
          {field('newPassword', 'New password', 'new-password')}
          {field('confirm', 'Confirm new password', 'new-password')}
          <div className="flex justify-end">
            <Button type="submit" loading={change.isPending}>
              Update password
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
