import { api } from './api';
import type {
  Activity,
  Address,
  CalendarEvent,
  Customer,
  CustomerStatus,
  DashboardSummary,
  Deal,
  DealStage,
  Paginated,
  PipelineColumn,
  RoomAccess,
  Task,
  TaskPriority,
  User,
} from './types';

export const authApi = {
  me: () => api<{ user: User }>('/auth/me', { ignoreUnauthorized: true }).then((r) => r.user),
  login: (body: { email: string; password: string }) =>
    api<{ user: User }>('/auth/login', { method: 'POST', body, ignoreUnauthorized: true }).then((r) => r.user),
  register: (body: { name: string; email: string; password: string }) =>
    api<{ user: User }>('/auth/register', { method: 'POST', body }).then((r) => r.user),
  logout: () => api<void>('/auth/logout', { method: 'POST', ignoreUnauthorized: true }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api<{ message: string }>('/auth/password', { method: 'PATCH', body }),
};

export interface CustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
  status?: CustomerStatus;
  address?: Partial<Address>;
  notes?: string;
  avatar?: string;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus | '';
  sort?: string;
}

export const customersApi = {
  list: (query: CustomerListParams) => api<Paginated<Customer>>('/customers', { query: { ...query } }),
  get: (id: string) =>
    api<{ customer: Customer; stats: { dealCount: number; openTaskCount: number } }>(`/customers/${id}`),
  create: (body: CustomerInput) =>
    api<{ customer: Customer }>('/customers', { method: 'POST', body }).then((r) => r.customer),
  update: (id: string, body: Partial<CustomerInput>) =>
    api<{ customer: Customer }>(`/customers/${id}`, { method: 'PATCH', body }).then((r) => r.customer),
  remove: (id: string) => api<void>(`/customers/${id}`, { method: 'DELETE' }),
};

export interface DealInput {
  customer: string;
  title: string;
  value: number;
  stage?: DealStage;
  expectedCloseDate?: string | null;
  appointmentDate?: string | null;
  address?: Partial<Address>;
  roomArea?: number | null;
  people?: number | null;
  roomAccess?: RoomAccess;
  instructions?: string;
  images?: string[];
  thumbnail?: string;
}

export interface DealListParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: DealStage | '';
  customer?: string;
  sort?: string;
  upcoming?: 'true';
  open?: 'true';
}

export const dealsApi = {
  list: (query: DealListParams) => api<Paginated<Deal>>('/deals', { query: { ...query } }),
  pipeline: (query: { search?: string; customer?: string }) =>
    api<{ stages: PipelineColumn[] }>('/deals/pipeline', { query }).then((r) => r.stages),
  get: (id: string) => api<{ deal: Deal }>(`/deals/${id}`).then((r) => r.deal),
  create: (body: DealInput) => api<{ deal: Deal }>('/deals', { method: 'POST', body }).then((r) => r.deal),
  update: (id: string, body: Partial<DealInput>) =>
    api<{ deal: Deal }>(`/deals/${id}`, { method: 'PATCH', body }).then((r) => r.deal),
  setStage: (id: string, stage: DealStage) =>
    api<{ deal: Deal }>(`/deals/${id}/stage`, { method: 'PATCH', body: { stage } }).then((r) => r.deal),
  remove: (id: string) => api<void>(`/deals/${id}`, { method: 'DELETE' }),
};

export interface ActivityInput {
  description: string;
  date?: string;
  images?: string[];
}

export const activitiesApi = {
  list: (dealId: string, page: number) =>
    api<Paginated<Activity>>(`/deals/${dealId}/activities`, { query: { page, limit: 5 } }),
  create: (dealId: string, body: ActivityInput) =>
    api<{ activity: Activity }>(`/deals/${dealId}/activities`, { method: 'POST', body }).then((r) => r.activity),
  update: (id: string, body: Partial<ActivityInput>) =>
    api<{ activity: Activity }>(`/activities/${id}`, { method: 'PATCH', body }).then((r) => r.activity),
  remove: (id: string) => api<void>(`/activities/${id}`, { method: 'DELETE' }),
};

export interface TaskInput {
  title: string;
  description?: string;
  dueDate: string;
  priority?: TaskPriority;
  done?: boolean;
  customer?: string | null;
  deal?: string | null;
}

export interface TaskListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  customer?: string;
  deal?: string;
  sort?: string;
}

export const tasksApi = {
  list: (query: TaskListParams) =>
    api<Paginated<Task>>('/tasks', { query: { ...query, tzOffset: query.status === 'today' ? new Date().getTimezoneOffset() : undefined } }),
  get: (id: string) => api<{ task: Task }>(`/tasks/${id}`).then((r) => r.task),
  create: (body: TaskInput) => api<{ task: Task }>('/tasks', { method: 'POST', body }).then((r) => r.task),
  update: (id: string, body: Partial<TaskInput>) =>
    api<{ task: Task }>(`/tasks/${id}`, { method: 'PATCH', body }).then((r) => r.task),
  remove: (id: string) => api<void>(`/tasks/${id}`, { method: 'DELETE' }),
};

export const dashboardApi = {
  summary: () =>
    api<DashboardSummary>('/dashboard/summary', { query: { tzOffset: new Date().getTimezoneOffset() } }),
};

export const calendarApi = {
  list: (from: string, to: string) => api<{ events: CalendarEvent[] }>('/calendar', { query: { from, to } }).then((r) => r.events),
};
