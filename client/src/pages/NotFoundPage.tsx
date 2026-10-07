import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';

export function NotFoundState({ title, message, to, cta }: { title: string; message: string; to: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
        <Compass className="size-8" strokeWidth={1.6} />
      </span>
      <h2 className="mt-5 text-2xl font-bold text-navy">{title}</h2>
      <p className="mt-2 max-w-sm text-muted">{message}</p>
      <Link to={to} className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 font-medium text-white hover:bg-primary-dark">
        {cta}
      </Link>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" />
      <NotFoundState title="Nothing here" message="The page you’re looking for doesn’t exist." to="/" cta="Go to dashboard" />
    </>
  );
}
