import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', loading, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <p className="text-[15px] leading-relaxed text-muted">{message}</p>
      <div className="mt-7 flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} data-autofocus>
          Cancel
        </Button>
        <Button className="bg-danger hover:bg-[#f25f5f]" loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
