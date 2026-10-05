export type CustomerStatus = 'lead' | 'active' | 'inactive';
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'won' | 'lost';
export type RoomAccess = 'keys_with_doorman' | 'keys_in_lockbox' | 'customer_present' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatusFilter = 'open' | 'done' | 'overdue' | 'upcoming' | 'today';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  address: Address;
  notes: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerRef = Pick<Customer, 'id' | 'firstName' | 'lastName' | 'name' | 'email' | 'phone' | 'company' | 'status' | 'avatar'>;

export interface Deal {
  id: string;
  customer: CustomerRef | null;
  title: string;
  value: number;
  stage: DealStage;
  expectedCloseDate: string | null;
  closedAt: string | null;
  address: Address;
  appointmentDate: string | null;
  roomArea: number | null;
  people: number | null;
  roomAccess: RoomAccess;
  instructions: string;
  images?: string[];
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  done: boolean;
  completedAt: string | null;
  overdue: boolean;
  customer: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'name' | 'email' | 'avatar'> | null;
  deal: Pick<Deal, 'id' | 'title' | 'stage'> | null;
  createdAt: string;
}

export interface Activity {
  id: string;
  deal: string;
  description: string;
  date: string;
  images?: string[];
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PipelineColumn {
  stage: DealStage;
  count: number;
  value: number;
  deals: Deal[];
}

export interface DashboardSummary {
  totalCustomers: number;
  customersByStatus: { status: CustomerStatus; count: number }[];
  totalDeals: number;
  openPipelineValue: number;
  openDealCount: number;
  dealsWonThisMonth: { count: number; value: number };
  tasksDueToday: number;
  overdueTasks: number;
  pipelineByStage: { stage: DealStage; count: number; value: number }[];
  generatedAt: string;
}

export type CalendarEventType = 'task' | 'appointment' | 'close';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  refId: string;
  title: string;
  date: string;
  done?: boolean;
  overdue?: boolean;
  priority?: TaskPriority;
  stage?: DealStage;
}
