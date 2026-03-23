import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { chatService } from '@/services/chatService';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system';
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: string[];
  unreadCount: number;
  isLoadingHistory: boolean;
}

const initialState: ChatState = {
  messages: [],
  isTyping: [],
  unreadCount: 0,
  isLoadingHistory: false,
};

export const loadChatHistory = createAsyncThunk(
  'chat/loadHistory',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      const result = await chatService.getMessages(meetingId);
      return result.messages.map((m: any) => ({
        id: m._id,
        senderId: typeof m.senderId === 'object' ? m.senderId._id : m.senderId,
        senderName: typeof m.senderId === 'object' ? m.senderId.name : 'Unknown',
        senderAvatar: typeof m.senderId === 'object' ? m.senderId.avatar : undefined,
        content: m.message,
        timestamp: new Date(m.timestamp).getTime(),
        type: m.type === 'system' ? 'system' : 'text',
      })) as ChatMessage[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load messages');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      // Avoid duplicates
      if (!state.messages.find(m => m.id === action.payload.id)) {
        state.messages.push(action.payload);
        state.unreadCount += 1;
      }
    },
    clearUnread(state) { state.unreadCount = 0; },
    setTyping(state, action: PayloadAction<string[]>) { state.isTyping = action.payload; },
    addTypingUser(state, action: PayloadAction<string>) {
      if (!state.isTyping.includes(action.payload)) {
        state.isTyping.push(action.payload);
      }
    },
    removeTypingUser(state, action: PayloadAction<string>) {
      state.isTyping = state.isTyping.filter(u => u !== action.payload);
    },
    clearChat() { return initialState; },
  },
  extraReducers: (builder) => {
    builder.addCase(loadChatHistory.pending, (state) => { state.isLoadingHistory = true; });
    builder.addCase(loadChatHistory.fulfilled, (state, action) => {
      state.isLoadingHistory = false;
      state.messages = action.payload;
    });
    builder.addCase(loadChatHistory.rejected, (state) => { state.isLoadingHistory = false; });
  },
});

export const { addMessage, clearUnread, setTyping, addTypingUser, removeTypingUser, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
