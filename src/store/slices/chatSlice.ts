import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
}

const initialState: ChatState = {
  messages: [],
  isTyping: [],
  unreadCount: 0,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
      state.unreadCount += 1;
    },
    clearUnread(state) { state.unreadCount = 0; },
    setTyping(state, action: PayloadAction<string[]>) { state.isTyping = action.payload; },
    clearChat() { return initialState; },
  },
});

export const { addMessage, clearUnread, setTyping, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
