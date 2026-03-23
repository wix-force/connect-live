import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  theme: 'light' | 'dark';
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isSettingsOpen: boolean;
  sidePanel: 'none' | 'chat' | 'participants';
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
}

const initialState: UiState = {
  theme: 'light',
  isChatOpen: false,
  isParticipantsOpen: false,
  isSettingsOpen: false,
  sidePanel: 'none',
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
    },
    setSidePanel(state, action: PayloadAction<UiState['sidePanel']>) {
      state.sidePanel = action.payload;
      state.isChatOpen = action.payload === 'chat';
      state.isParticipantsOpen = action.payload === 'participants';
    },
    toggleSettings(state) { state.isSettingsOpen = !state.isSettingsOpen; },
    addToast(state, action: PayloadAction<{ id: string; message: string; type: 'success' | 'error' | 'info' }>) {
      state.toasts.push(action.payload);
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
  },
});

export const { toggleTheme, setTheme, setSidePanel, toggleSettings, addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
