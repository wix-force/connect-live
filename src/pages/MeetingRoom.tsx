import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, Monitor, MessageSquare, Users,
  Hand, Disc, Settings, PhoneOff, MoreVertical, Copy, Shield, Clock
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { toggleMic, toggleCamera, toggleScreenShare, toggleHandRaise } from '@/store/slices/mediaSlice';
import { leaveMeeting, toggleRecording, createMeeting } from '@/store/slices/meetingSlice';
import { setSidePanel, toggleSettings } from '@/store/slices/uiSlice';
import { setParticipants, setActiveSpeaker, pinParticipant } from '@/store/slices/participantSlice';
import VideoTile from '@/components/meeting/VideoTile';
import ChatPanel from '@/components/meeting/ChatPanel';
import ParticipantsPanel from '@/components/meeting/ParticipantsPanel';
import SettingsModal from '@/components/meeting/SettingsModal';
import { AnimatePresence, motion } from 'framer-motion';

// Mock participants
const mockParticipants = [
  { id: '1', name: 'You', isMuted: false, isCameraOff: false, isSpeaking: true, isHost: true, isHandRaised: false, networkQuality: 'good' as const, isScreenSharing: false },
  { id: '2', name: 'Sarah Chen', isMuted: false, isCameraOff: false, isSpeaking: false, isHost: false, isHandRaised: false, networkQuality: 'good' as const, isScreenSharing: false },
  { id: '3', name: 'Mike Johnson', isMuted: true, isCameraOff: true, isSpeaking: false, isHost: false, isHandRaised: true, networkQuality: 'fair' as const, isScreenSharing: false },
  { id: '4', name: 'Emily Davis', isMuted: false, isCameraOff: false, isSpeaking: false, isHost: false, isHandRaised: false, networkQuality: 'good' as const, isScreenSharing: false },
  { id: '5', name: 'Alex Wilson', isMuted: true, isCameraOff: false, isSpeaking: false, isHost: false, isHandRaised: false, networkQuality: 'poor' as const, isScreenSharing: false },
  { id: '6', name: 'Lisa Park', isMuted: false, isCameraOff: true, isSpeaking: false, isHost: false, isHandRaised: false, networkQuality: 'good' as const, isScreenSharing: false },
];

function useTimer(startTime: number | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isMicOn, isCameraOn, isScreenSharing, isHandRaised } = useAppSelector(s => s.media);
  const { isRecording, startTime, connectionStatus, title, meetingId } = useAppSelector(s => s.meeting);
  const { sidePanel, isSettingsOpen } = useAppSelector(s => s.ui);
  const { participants, activeSpeakerId, pinnedParticipantId } = useAppSelector(s => s.participants);
  const unreadCount = useAppSelector(s => s.chat.unreadCount);
  const timer = useTimer(startTime);

  // Initialize meeting
  useEffect(() => {
    if (!meetingId) {
      dispatch(createMeeting({ id: id || 'demo', title: 'Team Meeting' }));
    }
    dispatch(setParticipants(mockParticipants));
    dispatch(setActiveSpeaker('1'));

    // Simulate random speaking
    const interval = setInterval(() => {
      const randomId = mockParticipants[Math.floor(Math.random() * mockParticipants.length)].id;
      dispatch(setActiveSpeaker(randomId));
    }, 4000);
    return () => clearInterval(interval);
  }, [dispatch, id, meetingId]);

  const handleLeave = useCallback(() => {
    dispatch(leaveMeeting());
    navigate('/dashboard');
  }, [dispatch, navigate]);

  const togglePanel = useCallback((panel: 'chat' | 'participants') => {
    dispatch(setSidePanel(sidePanel === panel ? 'none' : panel));
  }, [dispatch, sidePanel]);

  // Grid layout calculation
  const gridClass = useMemo(() => {
    const count = participants.length;
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3';
    if (count <= 9) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  }, [participants.length]);

  const isPanelOpen = sidePanel !== 'none';

  return (
    <div className="h-screen flex flex-col bg-meet-video-bg overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 flex items-center justify-between px-4 bg-meet-control-bg/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-meet-control-fg">{title}</h2>
          <div className="hidden sm:flex items-center gap-2 text-xs text-meet-control-fg/60">
            <Clock className="w-3.5 h-3.5" />
            <span>{timer}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-1.5 text-meet-danger">
              <span className="w-2 h-2 rounded-full bg-meet-danger animate-pulse" />
              <span className="text-xs font-medium">REC</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-meet-success" />
            <span className="text-xs text-meet-control-fg/60 hidden sm:inline capitalize">{connectionStatus}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(meetingId || id || '');
            }}
            className="hidden sm:flex items-center gap-1.5 text-xs text-meet-control-fg/60 hover:text-meet-control-fg transition-colors px-2 py-1 rounded hover:bg-meet-control-fg/10"
            aria-label="Copy meeting code"
          >
            <Copy className="w-3.5 h-3.5" />
            {(meetingId || id || '').slice(0, 12)}
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className={`flex-1 p-3 transition-all duration-300 ${isPanelOpen ? 'lg:mr-0' : ''}`}>
          <div className={`grid ${gridClass} gap-3 h-full auto-rows-fr`}>
            {participants.map(p => (
              <VideoTile
                key={p.id}
                participant={p}
                isActive={activeSpeakerId === p.id}
                isPinned={pinnedParticipantId === p.id}
                onPin={() => dispatch(pinParticipant(pinnedParticipantId === p.id ? null : p.id))}
                size={participants.length <= 2 ? 'lg' : participants.length <= 4 ? 'md' : 'sm'}
              />
            ))}
          </div>
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {isPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 meet-panel border-l border-border overflow-hidden hidden md:block"
              style={{ height: '100%' }}
            >
              <div className="w-[360px] h-full">
                {sidePanel === 'chat' && <ChatPanel />}
                {sidePanel === 'participants' && <ParticipantsPanel />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Control Bar */}
      <div className="h-20 flex items-center justify-center px-4 bg-meet-control-bg/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mic */}
          <button
            onClick={() => dispatch(toggleMic())}
            className={isMicOn ? 'meet-control-btn' : 'meet-control-btn-danger'}
            aria-label={isMicOn ? 'Mute microphone (Ctrl+D)' : 'Unmute microphone (Ctrl+D)'}
            title={isMicOn ? 'Mute (Ctrl+D)' : 'Unmute (Ctrl+D)'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={() => dispatch(toggleCamera())}
            className={isCameraOn ? 'meet-control-btn' : 'meet-control-btn-danger'}
            aria-label={isCameraOn ? 'Turn off camera (Ctrl+E)' : 'Turn on camera (Ctrl+E)'}
            title={isCameraOn ? 'Camera off (Ctrl+E)' : 'Camera on (Ctrl+E)'}
          >
            {isCameraOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={() => dispatch(toggleScreenShare())}
            className={isScreenSharing ? 'meet-control-btn-active' : 'meet-control-btn'}
            aria-label="Share screen"
            title="Present now"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Raise Hand */}
          <button
            onClick={() => dispatch(toggleHandRaise())}
            className={isHandRaised ? 'meet-control-btn-active' : 'meet-control-btn'}
            aria-label="Raise hand"
            title="Raise hand"
          >
            <Hand className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-meet-control-fg/20 mx-1 hidden sm:block" />

          {/* Chat */}
          <button
            onClick={() => togglePanel('chat')}
            className={`meet-control-btn relative ${sidePanel === 'chat' ? '!bg-primary' : ''}`}
            aria-label="Toggle chat"
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && sidePanel !== 'chat' && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-meet-danger text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Participants */}
          <button
            onClick={() => togglePanel('participants')}
            className={`meet-control-btn relative ${sidePanel === 'participants' ? '!bg-primary' : ''}`}
            aria-label="Toggle participants"
            title="People"
          >
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-meet-control-bg border border-meet-control-fg/20 text-[10px] font-bold flex items-center justify-center text-meet-control-fg">
              {participants.length}
            </span>
          </button>

          {/* Record */}
          <button
            onClick={() => dispatch(toggleRecording())}
            className={`meet-control-btn hidden sm:flex ${isRecording ? '!bg-meet-danger' : ''}`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            title="Record"
          >
            <Disc className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => dispatch(toggleSettings())}
            className="meet-control-btn hidden sm:flex"
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* More (mobile) */}
          <button className="meet-control-btn sm:hidden" aria-label="More options">
            <MoreVertical className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-meet-control-fg/20 mx-1 hidden sm:block" />

          {/* Leave */}
          <button
            onClick={handleLeave}
            className="meet-control-btn-danger px-6"
            aria-label="Leave meeting"
            title="Leave call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && <SettingsModal onClose={() => dispatch(toggleSettings())} />}
    </div>
  );
}
