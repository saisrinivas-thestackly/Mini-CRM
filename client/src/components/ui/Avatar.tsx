import clsx from 'clsx';
import { initials } from '../../lib/format';

const PALETTE = [
  ['#e0e7ff', '#4338ca'],
  ['#dcfce7', '#15803d'],
  ['#fee2e2', '#b91c1c'],
  ['#fef3c7', '#b45309'],
  ['#e0f2fe', '#0369a1'],
  ['#fce7f3', '#be185d'],
  ['#ede9fe', '#6d28d9'],
  ['#ccfbf1', '#0f766e'],
];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, src, size = 44, className }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  if (src) {
    return <img src={src} alt="" aria-hidden className={clsx('inline-block shrink-0 rounded-full object-cover', className)} style={style} />;
  }
  if (!name) {
    return <span aria-hidden className={clsx('inline-block shrink-0 rounded-full bg-placeholder', className)} style={style} />;
  }
  const [bg, fg] = colorFor(name);
  return (
    <span
      aria-hidden
      className={clsx('inline-grid shrink-0 place-items-center rounded-full font-semibold select-none', className)}
      style={{ ...style, background: bg, color: fg }}
    >
      {initials(name)}
    </span>
  );
}

export function DealThumb({ title, src, size = 44, className }: { title: string; src?: string | null; size?: number; className?: string }) {
  if (src) {
    return <img src={src} alt="" aria-hidden className={clsx('inline-block shrink-0 rounded-full object-cover', className)} style={{ width: size, height: size }} />;
  }
  const [bg, fg] = colorFor(title);
  return (
    <span
      aria-hidden
      className={clsx('relative inline-block shrink-0 overflow-hidden rounded-full', className)}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${bg}, #ffffff)` }}
    >
      <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto" style={{ width: size * 0.5, color: fg }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5 9.5V20h14V9.5" />
        <path d="M10 20v-5h4v5" />
      </svg>
    </span>
  );
}
