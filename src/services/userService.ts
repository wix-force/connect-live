import apiClient from './apiClient';

export const userService = {
  async getMe() {
    const { data } = await apiClient.get('/users/me');
    return data.data;
  },

  async updateProfile(updates: { name?: string; avatar?: string }) {
    const { data } = await apiClient.patch('/users/me', updates);
    return data.data;
  },
};
