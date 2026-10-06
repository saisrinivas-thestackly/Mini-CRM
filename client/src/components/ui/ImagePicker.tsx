import clsx from 'clsx';
import { X } from 'lucide-react';
import { useId, useRef, useState, type ChangeEvent } from 'react';
import { IMAGE_ACCEPT, ImageError, readImage, type ResizeOptions } from '../../lib/images';

interface Props {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  max: number;
  resize: ResizeOptions;
  wide?: boolean;
  round?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ImagePicker({ label, images, onChange, max, resize, wide, round, disabled, loading, className }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, max - images.length);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      const added = await Promise.all(files.map((f) => readImage(f, resize)));
      onChange([...images, ...added].slice(0, max));
    } catch (err) {
      setError(err instanceof ImageError ? err.message : 'Could not add that image.');
    } finally {
      setBusy(false);
    }
  };

  const canAdd = images.length < max && !disabled && !loading;

  return (
    <div className={className}>
      <p className="label">{label}</p>
      <div className={clsx('flex flex-wrap gap-3', wide && 'flex-col')}>
        {images.map((src, i) => (
          <div key={i} className={clsx('relative', wide ? 'h-40 w-full' : 'size-[72px]')}>
            <img
              src={src}
              alt={`${label} ${i + 1}`}
              className={clsx('size-full border border-line bg-field object-cover', round ? 'rounded-full' : 'rounded-xl')}
            />
            {!disabled && (
              <button
                type="button"
                aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className={clsx(
                  'absolute grid size-6 place-items-center rounded-full bg-navy/70 text-white hover:bg-navy',
                  round ? 'right-0 bottom-0' : 'top-1 right-1',
                )}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        ))}
        {(images.length < max || loading) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!canAdd || busy}
            className={clsx(
              'grid place-items-center rounded-xl border border-line bg-field text-[16px] tracking-wide text-muted uppercase transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60',
              wide ? 'h-12 w-full' : 'h-12 min-w-[74px] px-5',
            )}
          >
            {busy || loading ? '…' : 'Add'}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple={max - images.length > 1}
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        onChange={onFiles}
      />
      {error && (
        <p className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
