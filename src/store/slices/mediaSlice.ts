import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MediaState {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  selectedMic: string | null;
  selectedCamera: string | null;
  selectedSpeaker: string | null;
  isBackgroundBlur: boolean;
  devices: { id: string; label: string; kind: MediaDeviceKind }[];
}

const initialState: MediaState = {
  isMicOn: true,
  isCameraOn: true,
  isScreenSharing: false,
  isHandRaised: false,
  selectedMic: null,
  selectedCamera: null,
  selectedSpeaker: null,
  isBackgroundBlur: false,
  devices: [],
};

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    toggleMic(state) { state.isMicOn = !state.isMicOn; },
    toggleCamera(state) { state.isCameraOn = !state.isCameraOn; },
    toggleScreenShare(state) { state.isScreenSharing = !state.isScreenSharing; },
    toggleHandRaise(state) { state.isHandRaised = !state.isHandRaised; },
    toggleBackgroundBlur(state) { state.isBackgroundBlur = !state.isBackgroundBlur; },
    setSelectedMic(state, action: PayloadAction<string>) { state.selectedMic = action.payload; },
    setSelectedCamera(state, action: PayloadAction<string>) { state.selectedCamera = action.payload; },
    setSelectedSpeaker(state, action: PayloadAction<string>) { state.selectedSpeaker = action.payload; },
    setDevices(state, action: PayloadAction<MediaState['devices']>) { state.devices = action.payload; },
  },
});

export const { toggleMic, toggleCamera, toggleScreenShare, toggleHandRaise, toggleBackgroundBlur, setSelectedMic, setSelectedCamera, setSelectedSpeaker, setDevices } = mediaSlice.actions;
export default mediaSlice.reducer;
