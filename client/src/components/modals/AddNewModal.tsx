import { ArrowRight, BriefcaseBusiness, ListChecks, Users } from 'lucide-react';
import { useModals } from '../../context/ModalsContext';
import { Modal } from '../ui/Modal';

export function AddNewModal({ onClose, hidden }: { onClose: () => void; hidden?: boolean }) {
  const { replace } = useModals();

  const items = [
    {
      label: 'Deal',
      icon: <BriefcaseBusiness className="size-6" strokeWidth={1.5} />,
      onClick: () =>
        replace({ type: 'selectCustomer', onSelect: (customer) => replace({ type: 'dealForm', customer }) }),
    },
    {
      label: 'Customer',
      icon: <Users className="size-6" strokeWidth={1.5} />,
      onClick: () => replace({ type: 'customerForm' }),
    },
    {
      label: 'Task',
      icon: <ListChecks className="size-6" strokeWidth={1.5} />,
      onClick: () => replace({ type: 'taskForm' }),
    },
  ];

  return (
    <Modal title="Add New" onClose={onClose} hidden={hidden} size="sm" titleClassName="!font-normal !text-muted !text-lg">
      <ul className="-mx-6 -mb-6 mt-2 border-t border-line sm:-mx-8">
        {items.map((item) => (
          <li key={item.label} className="border-b border-line last:border-b-0">
            <button
              type="button"
              onClick={item.onClick}
              className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-page sm:px-8"
              data-autofocus={item.label === 'Deal' ? true : undefined}
            >
              <span className="text-muted">{item.icon}</span>
              <span className="flex-1 text-lg font-medium text-navy">{item.label}</span>
              <ArrowRight className="size-5 text-primary" />
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
