import apiClient from './apiClient';

export interface DashboardOverview {
  meetingCount: number;
  upcomingMeetings: number;
  totalHours: number;
  recordingsCount: number;
}

export interface ActivityData {
  day: string;
  meetings: number;
}

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    const { data } = await apiClient.get('/dashboard/overview');
    return data.data;
  },
  async getActivity(): Promise<ActivityData[]> {
    const { data } = await apiClient.get('/dashboard/activity');
    return data.data;
  },
};
