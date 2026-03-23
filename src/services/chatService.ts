import apiClient from './apiClient';

export interface MessageData {
  _id: string;
  meetingId: string;
  senderId: { _id: string; name: string; avatar?: string } | string;
  message: string;
  type: 'text' | 'file' | 'system';
  timestamp: string;
}

export const chatService = {
  async getMessages(meetingId: string, page = 1, limit = 50): Promise<{ messages: MessageData[]; total: number }> {
    const { data } = await apiClient.get(`/messages/${meetingId}`, { params: { page, limit } });
    return data.data;
  },

  async sendMessage(meetingId: string, message: string, type: string = 'text'): Promise<MessageData> {
    const { data } = await apiClient.post('/messages', { meetingId, message, type });
    return data.data;
  },
};
