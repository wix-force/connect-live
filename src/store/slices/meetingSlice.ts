import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { meetingService, CreateMeetingPayload, MeetingData } from '@/services/meetingService';

interface MeetingState {
  meetingId: string | null;
  title: string;
  isHost: boolean;
  isActive: boolean;
  isRecording: boolean;
  startTime: number | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  meetings: MeetingData[];
  currentMeeting: MeetingData | null;
  isLoadingMeetings: boolean;
  isCreating: boolean;
}

const initialState: MeetingState = {
  meetingId: null,
  title: 'Team Meeting',
  isHost: false,
  isActive: false,
  isRecording: false,
  startTime: null,
  connectionStatus: 'disconnected',
  meetings: [],
  currentMeeting: null,
  isLoadingMeetings: false,
  isCreating: false,
};

export const createMeetingAsync = createAsyncThunk(
  'meeting/create',
  async (payload: CreateMeetingPayload, { rejectWithValue }) => {
    try {
      return await meetingService.create(payload);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create meeting');
    }
  }
);

export const fetchMeetings = createAsyncThunk(
  'meeting/fetchAll',
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      return await meetingService.getAll(status);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch meetings');
    }
  }
);

export const fetchMeetingById = createAsyncThunk(
  'meeting/fetchById',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      return await meetingService.getById(meetingId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Meeting not found');
    }
  }
);

export const joinMeetingAsync = createAsyncThunk(
  'meeting/join',
  async ({ meetingId, password }: { meetingId: string; password?: string }, { rejectWithValue }) => {
    try {
      return await meetingService.join(meetingId, password);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to join meeting');
    }
  }
);

export const endMeetingAsync = createAsyncThunk(
  'meeting/end',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      return await meetingService.end(meetingId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to end meeting');
    }
  }
);

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    setMeetingActive(state, action: PayloadAction<{ id: string; title: string; isHost: boolean }>) {
      state.meetingId = action.payload.id;
      state.title = action.payload.title;
      state.isHost = action.payload.isHost;
      state.isActive = true;
      state.startTime = Date.now();
      state.connectionStatus = 'connected';
    },
    leaveMeeting() { return initialState; },
    setConnectionStatus(state, action: PayloadAction<MeetingState['connectionStatus']>) {
      state.connectionStatus = action.payload;
    },
    toggleRecording(state) { state.isRecording = !state.isRecording; },
    meetingUpdated(state, action: PayloadAction<Partial<MeetingData>>) {
      if (state.currentMeeting) {
        Object.assign(state.currentMeeting, action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    // Create
    builder.addCase(createMeetingAsync.pending, (state) => { state.isCreating = true; });
    builder.addCase(createMeetingAsync.fulfilled, (state, action) => {
      state.isCreating = false;
      state.currentMeeting = action.payload;
      state.meetingId = action.payload.meetingId;
      state.title = action.payload.title;
      state.isHost = true;
      state.isActive = true;
      state.startTime = Date.now();
      state.connectionStatus = 'connecting';
    });
    builder.addCase(createMeetingAsync.rejected, (state) => { state.isCreating = false; });
    // Fetch all
    builder.addCase(fetchMeetings.pending, (state) => { state.isLoadingMeetings = true; });
    builder.addCase(fetchMeetings.fulfilled, (state, action) => {
      state.isLoadingMeetings = false;
      state.meetings = action.payload;
    });
    builder.addCase(fetchMeetings.rejected, (state) => { state.isLoadingMeetings = false; });
    // Fetch by ID
    builder.addCase(fetchMeetingById.fulfilled, (state, action) => {
      state.currentMeeting = action.payload;
    });
    // Join
    builder.addCase(joinMeetingAsync.fulfilled, (state, action) => {
      state.currentMeeting = action.payload;
      state.meetingId = action.payload.meetingId;
      state.title = action.payload.title;
      state.isActive = true;
      state.startTime = Date.now();
      state.connectionStatus = 'connecting';
    });
    // End
    builder.addCase(endMeetingAsync.fulfilled, (state) => {
      state.isActive = false;
      state.connectionStatus = 'disconnected';
    });
  },
});

export const { setMeetingActive, leaveMeeting, setConnectionStatus, toggleRecording, meetingUpdated } = meetingSlice.actions;
export default meetingSlice.reducer;
