import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardService, DashboardOverview, ActivityData } from '@/services/dashboardService';

interface DashboardState {
  overview: DashboardOverview | null;
  activity: ActivityData[];
  isLoading: boolean;
}

const initialState: DashboardState = {
  overview: null,
  activity: [],
  isLoading: false,
};

export const fetchDashboardOverview = createAsyncThunk(
  'dashboard/fetchOverview',
  async (_, { rejectWithValue }) => {
    try { return await dashboardService.getOverview(); }
    catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

export const fetchDashboardActivity = createAsyncThunk(
  'dashboard/fetchActivity',
  async (_, { rejectWithValue }) => {
    try { return await dashboardService.getActivity(); }
    catch (err: any) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchDashboardOverview.pending, (state) => { state.isLoading = true; });
    builder.addCase(fetchDashboardOverview.fulfilled, (state, action) => {
      state.isLoading = false;
      state.overview = action.payload;
    });
    builder.addCase(fetchDashboardOverview.rejected, (state) => { state.isLoading = false; });
    builder.addCase(fetchDashboardActivity.fulfilled, (state, action) => {
      state.activity = action.payload;
    });
  },
});

export default dashboardSlice.reducer;
