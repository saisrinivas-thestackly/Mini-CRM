import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../lib/api';
import {
  activitiesApi,
  calendarApi,
  customersApi,
  dashboardApi,
  dealsApi,
  tasksApi,
  type ActivityInput,
  type CustomerInput,
  type CustomerListParams,
  type DealInput,
  type DealListParams,
  type TaskInput,
  type TaskListParams,
} from '../lib/services';
import type { DealStage, PipelineColumn } from '../lib/types';

function useRefreshAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
}

export const useCustomers = (params: CustomerListParams) =>
  useQuery({ queryKey: ['customers', params], queryFn: () => customersApi.list(params), placeholderData: keepPreviousData });

export const useCustomer = (id: string | undefined) =>
  useQuery({ queryKey: ['customer', id], queryFn: () => customersApi.get(id!), enabled: !!id });

export const useDeals = (params: DealListParams, enabled = true) =>
  useQuery({ queryKey: ['deals', params], queryFn: () => dealsApi.list(params), placeholderData: keepPreviousData, enabled });

export const useDeal = (id: string | undefined) =>
  useQuery({ queryKey: ['deal', id], queryFn: () => dealsApi.get(id!), enabled: !!id });

export const usePipeline = (params: { search?: string; customer?: string }, enabled = true) =>
  useQuery({ queryKey: ['pipeline', params], queryFn: () => dealsApi.pipeline(params), enabled });

export const useTasks = (params: TaskListParams, enabled = true) =>
  useQuery({ queryKey: ['tasks', params], queryFn: () => tasksApi.list(params), placeholderData: keepPreviousData, enabled });

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.summary });

export const useCalendar = (from: string, to: string) =>
  useQuery({ queryKey: ['calendar', from, to], queryFn: () => calendarApi.list(from, to), placeholderData: keepPreviousData });

export const useActivities = (dealId: string | undefined) =>
  useInfiniteQuery({
    queryKey: ['activities', dealId],
    queryFn: ({ pageParam }) => activitiesApi.list(dealId!, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!dealId,
  });

export function useSaveCustomer() {
  const refresh = useRefreshAll();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: CustomerInput }) =>
      id ? customersApi.update(id, body) : customersApi.create(body),
    onSuccess: () => {
      toast.saved('Customer Saved');
      return refresh();
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  const refresh = useRefreshAll();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: ['customer', id] });
      toast.deleted('Customer Deleted');
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useSaveDeal() {
  const refresh = useRefreshAll();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: DealInput }) => (id ? dealsApi.update(id, body) : dealsApi.create(body)),
    onSuccess: () => {
      toast.saved('Deal Saved');
      return refresh();
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  const refresh = useRefreshAll();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => dealsApi.remove(id),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: ['deal', id] });
      qc.removeQueries({ queryKey: ['activities', id] });
      toast.deleted('Deal Deleted');
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useMoveDeal() {
  const qc = useQueryClient();
  const refresh = useRefreshAll();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) => dealsApi.setStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ['pipeline'] });
      const snapshots = qc.getQueriesData<PipelineColumn[]>({ queryKey: ['pipeline'] });
      for (const [key, columns] of snapshots) {
        if (!columns) continue;
        const deal = columns.flatMap((c) => c.deals).find((d) => d.id === id);
        if (!deal || deal.stage === stage) continue;
        qc.setQueryData<PipelineColumn[]>(
          key,
          columns.map((c) => {
            if (c.stage === deal.stage) {
              return { ...c, count: c.count - 1, value: c.value - deal.value, deals: c.deals.filter((d) => d.id !== id) };
            }
            if (c.stage === stage) {
              return { ...c, count: c.count + 1, value: c.value + deal.value, deals: [{ ...deal, stage }, ...c.deals] };
            }
            return c;
          }),
        );
      }
      return { snapshots };
    },
    onError: (err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(`Couldn't move deal: ${errorMessage(err)}`);
    },
    onSuccess: (deal) => toast.saved(`Moved to ${deal.stage[0].toUpperCase()}${deal.stage.slice(1)}`),
    onSettled: () => refresh(),
  });
}

export function useSaveActivity(dealId: string) {
  const refresh = useRefreshAll();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: ActivityInput }) =>
      id ? activitiesApi.update(id, body) : activitiesApi.create(dealId, body),
    onSuccess: (_a, { id }) => {
      toast.saved(id ? 'Activity Saved' : 'Activity Recorded');
      return refresh();
    },
  });
}

export function useDeleteActivity() {
  const refresh = useRefreshAll();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => activitiesApi.remove(id),
    onSuccess: () => {
      toast.deleted('Activity Deleted');
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useSaveTask() {
  const refresh = useRefreshAll();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Partial<TaskInput> }) =>
      id ? tasksApi.update(id, body) : tasksApi.create(body as TaskInput),
    onSuccess: () => {
      toast.saved('Task Saved');
      return refresh();
    },
  });
}

export function useToggleTask() {
  const refresh = useRefreshAll();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => tasksApi.update(id, { done }),
    onSuccess: (task) => {
      toast.saved(task.done ? 'Task Completed' : 'Task Reopened');
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useDeleteTask() {
  const refresh = useRefreshAll();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      toast.deleted('Task Deleted');
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}
