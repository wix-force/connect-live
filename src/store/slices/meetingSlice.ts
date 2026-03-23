import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MeetingState {
  meetingId: string | null;
  title: string;
  isHost: boolean;
  isActive: boolean;
  isRecording: boolean;
  startTime: number | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

const initialState: MeetingState = {
  meetingId: null,
  title: 'Team Meeting',
  isHost: false,
  isActive: false,
  isRecording: false,
  startTime: null,
  connectionStatus: 'disconnected',
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    createMeeting(state, action: PayloadAction<{ id: string; title: string }>) {
      state.meetingId = action.payload.id;
      state.title = action.payload.title;
      state.isHost = true;
      state.isActive = true;
      state.startTime = Date.now();
      state.connectionStatus = 'connected';
    },
    joinMeeting(state, action: PayloadAction<string>) {
      state.meetingId = action.payload;
      state.isActive = true;
      state.startTime = Date.now();
      state.connectionStatus = 'connected';
    },
    leaveMeeting() { return initialState; },
    setConnectionStatus(state, action: PayloadAction<MeetingState['connectionStatus']>) {
      state.connectionStatus = action.payload;
    },
    toggleRecording(state) { state.isRecording = !state.isRecording; },
  },
});

export const { createMeeting, joinMeeting, leaveMeeting, setConnectionStatus, toggleRecording } = meetingSlice.actions;
export default meetingSlice.reducer;
