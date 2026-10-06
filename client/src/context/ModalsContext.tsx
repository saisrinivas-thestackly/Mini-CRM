import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { SelectCustomerModal } from '../components/customers/SelectCustomerModal';
import { ActivityModal } from '../components/deals/ActivityModal';
import { DealFormModal } from '../components/deals/DealFormModal';
import { AddNewModal } from '../components/modals/AddNewModal';
import { SearchModal } from '../components/modals/SearchModal';
import { TaskFormModal, type TaskDefaults } from '../components/tasks/TaskFormModal';
import type { Activity, Customer, CustomerRef, Deal, Task } from '../lib/types';

type ModalSpec =
  | { type: 'addNew' }
  | { type: 'search' }
  | { type: 'customerForm'; customer?: Customer; onSaved?: (c: Customer) => void }
  | { type: 'selectCustomer'; onSelect: (c: CustomerRef) => void }
  | { type: 'dealForm'; deal?: Deal; customer?: CustomerRef | null }
  | { type: 'taskForm'; task?: Task; defaults?: TaskDefaults }
  | { type: 'activity'; activity: Activity; dealId: string };

interface ModalsApi {
  open: (spec: ModalSpec) => void;
  replace: (spec: ModalSpec) => void;
  close: () => void;
  newDeal: (customer?: CustomerRef | null) => void;
}

const ModalsContext = createContext<ModalsApi | null>(null);

export function ModalsProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<ModalSpec[]>([]);

  const open = useCallback((spec: ModalSpec) => setStack((s) => [...s, spec]), []);
  const close = useCallback(() => setStack((s) => s.slice(0, -1)), []);
  const replace = useCallback((spec: ModalSpec) => setStack((s) => [...s.slice(0, -1), spec]), []);

  const newDeal = useCallback(
    (customer?: CustomerRef | null) => {
      if (customer) return open({ type: 'dealForm', customer });
      return open({ type: 'selectCustomer', onSelect: (c) => replace({ type: 'dealForm', customer: c }) });
    },
    [open, replace],
  );

  const api = useMemo<ModalsApi>(() => ({ open, replace, close, newDeal }), [open, replace, close, newDeal]);

  function render(spec: ModalSpec, index: number) {
    const hidden = index < stack.length - 1;
    const common = { onClose: close, hidden };
    switch (spec.type) {
      case 'addNew':
        return <AddNewModal key={index} {...common} />;
      case 'search':
        return <SearchModal key={index} {...common} />;
      case 'customerForm':
        return <CustomerFormModal key={index} {...common} customer={spec.customer} onSaved={spec.onSaved} />;
      case 'selectCustomer':
        return <SelectCustomerModal key={index} {...common} onSelect={spec.onSelect} />;
      case 'dealForm':
        return <DealFormModal key={index} {...common} deal={spec.deal} initialCustomer={spec.customer ?? null} />;
      case 'taskForm':
        return <TaskFormModal key={index} {...common} task={spec.task} defaults={spec.defaults} />;
      case 'activity':
        return <ActivityModal key={index} {...common} activity={spec.activity} dealId={spec.dealId} />;
      default:
        return null;
    }
  }

  return (
    <ModalsContext.Provider value={api}>
      {children}
      {stack.map(render)}
    </ModalsContext.Provider>
  );
}

export function useModals() {
  const ctx = useContext(ModalsContext);
  if (!ctx) throw new Error('useModals must be used inside <ModalsProvider>');
  return ctx;
}
