import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutGrid, Calendar, Video, Disc, MessageSquare, Bell, Settings,
} from 'lucide-react';
import DashboardLayout, { NavItem } from '@/components/layouts/DashboardLayout';

const DashboardOverview = lazy(() => import('./dashboard/DashboardOverview'));
const MyMeetingsPage = lazy(() => import('./dashboard/MyMeetingsPage'));
const ScheduleMeetingPage = lazy(() => import('./dashboard/ScheduleMeetingPage'));
const RecordingsPage = lazy(() => import('./dashboard/RecordingsPage'));
const ProfileSettingsPage = lazy(() => import('./dashboard/ProfileSettingsPage'));

const userNav: NavItem[] = [
  { icon: LayoutGrid, label: 'Overview', path: '/dashboard' },
  { icon: Video, label: 'My Meetings', path: '/dashboard/meetings' },
  { icon: Calendar, label: 'Schedule', path: '/dashboard/schedule' },
  { icon: Disc, label: 'Recordings', path: '/dashboard/recordings' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

export default function UserDashboard() {
  return (
    <DashboardLayout navItems={userNav} title="Dashboard">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<DashboardOverview />} />
          <Route path="meetings" element={<MyMeetingsPage />} />
          <Route path="schedule" element={<ScheduleMeetingPage />} />
          <Route path="recordings" element={<RecordingsPage />} />
          <Route path="settings" element={<ProfileSettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}
