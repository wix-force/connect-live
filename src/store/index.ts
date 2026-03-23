import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import meetingReducer from './slices/meetingSlice';
import participantReducer from './slices/participantSlice';
import chatReducer from './slices/chatSlice';
import uiReducer from './slices/uiSlice';
import mediaReducer from './slices/mediaSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    meeting: meetingReducer,
    participants: participantReducer,
    chat: chatReducer,
    ui: uiReducer,
    media: mediaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
