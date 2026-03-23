import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
  isHost: boolean;
  isHandRaised: boolean;
  networkQuality: 'good' | 'fair' | 'poor';
  isScreenSharing: boolean;
}

interface ParticipantState {
  participants: Participant[];
  activeSpeakerId: string | null;
  pinnedParticipantId: string | null;
}

const initialState: ParticipantState = {
  participants: [],
  activeSpeakerId: null,
  pinnedParticipantId: null,
};

const participantSlice = createSlice({
  name: 'participants',
  initialState,
  reducers: {
    setParticipants(state, action: PayloadAction<Participant[]>) {
      state.participants = action.payload;
    },
    addParticipant(state, action: PayloadAction<Participant>) {
      state.participants.push(action.payload);
    },
    removeParticipant(state, action: PayloadAction<string>) {
      state.participants = state.participants.filter(p => p.id !== action.payload);
    },
    updateParticipant(state, action: PayloadAction<{ id: string; changes: Partial<Participant> }>) {
      const idx = state.participants.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) Object.assign(state.participants[idx], action.payload.changes);
    },
    setActiveSpeaker(state, action: PayloadAction<string | null>) {
      state.activeSpeakerId = action.payload;
    },
    pinParticipant(state, action: PayloadAction<string | null>) {
      state.pinnedParticipantId = action.payload;
    },
  },
});

export const { setParticipants, addParticipant, removeParticipant, updateParticipant, setActiveSpeaker, pinParticipant } = participantSlice.actions;
export default participantSlice.reducer;
