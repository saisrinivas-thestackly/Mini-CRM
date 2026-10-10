import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader } from './components/ui/States';
import { LoginPage, RegisterPage } from './pages/AuthPages';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })));
const DealsPage = lazy(() => import('./pages/DealsPage').then((m) => ({ default: m.DealsPage })));
const DealDetailPage = lazy(() => import('./pages/DealDetailPage').then((m) => ({ default: m.DealDetailPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const page = (node: ReactNode) => <Suspense fallback={<PageLoader />}>{node}</Suspense>;

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<AppLayout />}>
        <Route index element={page(<DashboardPage />)} />
        <Route path="customers" element={page(<CustomersPage />)} />
        <Route path="customers/:id" element={page(<CustomerDetailPage />)} />
        <Route path="deals" element={page(<DealsPage />)} />
        <Route path="deals/:id" element={page(<DealDetailPage />)} />
        <Route path="tasks" element={page(<TasksPage />)} />
        <Route path="calendar" element={page(<CalendarPage />)} />
        <Route path="notifications" element={page(<NotificationsPage />)} />
        <Route path="settings" element={page(<SettingsPage />)} />
        <Route path="*" element={page(<NotFoundPage />)} />
      </Route>
    </Routes>
  );
}
