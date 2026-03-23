import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminService, AdminStats, AdminUser, AdminAnalytics, ServerStatus } from '@/services/adminService';

interface AdminState {
  stats: AdminStats | null;
  users: AdminUser[];
  usersTotal: number;
  usersPage: number;
  activeMeetings: any[];
  analytics: AdminAnalytics | null;
  serverStatus: ServerStatus | null;
  isLoading: boolean;
}

const initialState: AdminState = {
  stats: null,
  users: [],
  usersTotal: 0,
  usersPage: 1,
  activeMeetings: [],
  analytics: null,
  serverStatus: null,
  isLoading: false,
};

export const fetchAdminStats = createAsyncThunk('admin/fetchStats', async (_, { rejectWithValue }) => {
  try { return await adminService.getStats(); }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const fetchAdminUsers = createAsyncThunk('admin/fetchUsers', async ({ page, limit }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
  try { return await adminService.getUsers(page, limit); }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const fetchActiveMeetings = createAsyncThunk('admin/fetchActiveMeetings', async (_, { rejectWithValue }) => {
  try { return await adminService.getActiveMeetings(); }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const fetchAdminAnalytics = createAsyncThunk('admin/fetchAnalytics', async (_, { rejectWithValue }) => {
  try { return await adminService.getAnalytics(); }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const fetchServerStatus = createAsyncThunk('admin/fetchServerStatus', async (_, { rejectWithValue }) => {
  try { return await adminService.getServerStatus(); }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchAdminStats.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchAdminStats.fulfilled, (state, action) => { state.isLoading = false; state.stats = action.payload; });
    builder.addCase(fetchAdminStats.rejected, (state) => { state.isLoading = false; });
    builder.addCase(fetchAdminUsers.fulfilled, (state, action) => {
      state.users = action.payload.users;
      state.usersTotal = action.payload.total;
      state.usersPage = action.payload.page;
    });
    builder.addCase(fetchActiveMeetings.fulfilled, (state, action) => { state.activeMeetings = action.payload; });
    builder.addCase(fetchAdminAnalytics.fulfilled, (state, action) => { state.analytics = action.payload; });
    builder.addCase(fetchServerStatus.fulfilled, (state, action) => { state.serverStatus = action.payload; });
  },
});

export default adminSlice.reducer;
