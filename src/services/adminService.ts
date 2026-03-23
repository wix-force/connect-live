import apiClient from './apiClient';

export interface AdminStats {
  totalUsers: number;
  totalMeetings: number;
  activeMeetings: number;
  totalMessages: number;
  uptime: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface AdminAnalytics {
  meetingsLast30Days: number;
  newUsersLast30Days: number;
  avgParticipantsPerMeeting: number;
}

export interface ServerStatus {
  cpuUsage: number;
  memoryUsage: number;
  activeSockets: number;
  uptime: number;
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const { data } = await apiClient.get('/admin/stats');
    return data.data;
  },
  async getUsers(page = 1, limit = 20): Promise<{ users: AdminUser[]; total: number; page: number; limit: number }> {
    const { data } = await apiClient.get('/admin/users', { params: { page, limit } });
    return data.data;
  },
  async getActiveMeetings() {
    const { data } = await apiClient.get('/admin/meetings/active');
    return data.data;
  },
  async banUser(userId: string) {
    const { data } = await apiClient.post(`/admin/users/${userId}/ban`);
    return data;
  },
  async updateUserRole(userId: string, role: string) {
    const { data } = await apiClient.patch(`/admin/users/${userId}/role`, { role });
    return data;
  },
  async getAnalytics(): Promise<AdminAnalytics> {
    const { data } = await apiClient.get('/admin/analytics');
    return data.data;
  },
  async forceEndMeeting(meetingId: string) {
    const { data } = await apiClient.delete(`/admin/meetings/${meetingId}/end`);
    return data;
  },
  async getServerStatus(): Promise<ServerStatus> {
    const { data } = await apiClient.get('/admin/server-status');
    return data.data;
  },
};
