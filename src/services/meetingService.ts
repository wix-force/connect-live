import apiClient from './apiClient';

export interface CreateMeetingPayload {
  title?: string;
  password?: string;
  scheduledAt?: string;
  settings?: {
    waitingRoom?: boolean;
    muteOnEntry?: boolean;
    allowScreenShare?: boolean;
    allowChat?: boolean;
    maxParticipants?: number;
  };
}

export interface MeetingData {
  _id: string;
  meetingId: string;
  hostId: { _id: string; name: string; email: string; avatar?: string } | string;
  title: string;
  password?: string;
  startTime?: string;
  endTime?: string;
  scheduledAt?: string;
  status: 'waiting' | 'active' | 'ended';
  participants: string[];
  settings: {
    waitingRoom: boolean;
    muteOnEntry: boolean;
    allowScreenShare: boolean;
    allowChat: boolean;
    allowRecording: boolean;
    maxParticipants: number;
  };
  createdAt: string;
}

export const meetingService = {
  async create(payload: CreateMeetingPayload): Promise<MeetingData> {
    const { data } = await apiClient.post('/meetings', payload);
    return data.data;
  },

  async getAll(status?: string): Promise<MeetingData[]> {
    const params = status ? { status } : {};
    const { data } = await apiClient.get('/meetings', { params });
    return data.data;
  },

  async getById(meetingId: string): Promise<MeetingData> {
    const { data } = await apiClient.get(`/meetings/${meetingId}`);
    return data.data;
  },

  async join(meetingId: string, password?: string): Promise<MeetingData> {
    const { data } = await apiClient.post(`/meetings/${meetingId}/join`, { password });
    return data.data;
  },

  async end(meetingId: string): Promise<MeetingData> {
    const { data } = await apiClient.post(`/meetings/${meetingId}/end`);
    return data.data;
  },

  async updateSettings(meetingId: string, updates: Partial<CreateMeetingPayload>): Promise<MeetingData> {
    const { data } = await apiClient.patch(`/meetings/${meetingId}`, updates);
    return data.data;
  },
};
