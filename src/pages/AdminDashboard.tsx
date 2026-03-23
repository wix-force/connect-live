import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutGrid, Users, Video, BarChart3, Server, Settings,
} from 'lucide-react';
import DashboardLayout, { NavItem } from '@/components/layouts/DashboardLayout';

const AdminOverview = lazy(() => import('./admin/AdminOverview'));
const UsersManagementPage = lazy(() => import('./admin/UsersManagementPage'));
const MeetingsMonitorPage = lazy(() => import('./admin/MeetingsMonitorPage'));
const AnalyticsPage = lazy(() => import('./admin/AnalyticsPage'));
const ServerStatusPage = lazy(() => import('./admin/ServerStatusPage'));
const ProfileSettingsPage = lazy(() => import('./dashboard/ProfileSettingsPage'));

const adminNav: NavItem[] = [
  { icon: LayoutGrid, label: 'Overview', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: Video, label: 'Meetings', path: '/admin/meetings' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Server, label: 'Server Status', path: '/admin/server' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={adminNav} title="Admin Panel">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<UsersManagementPage />} />
          <Route path="meetings" element={<MeetingsMonitorPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="server" element={<ServerStatusPage />} />
          <Route path="settings" element={<ProfileSettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}
