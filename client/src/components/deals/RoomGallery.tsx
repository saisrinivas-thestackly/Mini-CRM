import clsx from 'clsx';
import { ImagePlus } from 'lucide-react';
import { useState } from 'react';

export function RoomGallery({ images, title, onAdd }: { images: string[]; title: string; onAdd: () => void }) {
  const [active, setActive] = useState(0);
  const current = images[Math.min(active, images.length - 1)];

  if (!current) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="grid aspect-square w-full place-items-center rounded-2xl bg-placeholder text-muted transition-colors hover:text-primary"
      >
        <span className="flex flex-col items-center gap-2 text-sm">
          <ImagePlus className="size-7" strokeWidth={1.5} />
          Add room images
        </span>
      </button>
    );
  }

  return (
    <div>
      <img src={current} alt={`${title} room`} className="aspect-square w-full rounded-2xl object-cover" />
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={clsx('size-14 overflow-hidden rounded-lg ring-2 transition', i === active ? 'ring-primary' : 'ring-transparent opacity-70 hover:opacity-100')}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
