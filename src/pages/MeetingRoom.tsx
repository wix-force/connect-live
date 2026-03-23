import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, Monitor, MessageSquare, Users,
  Hand, Disc, Settings, PhoneOff, MoreVertical, Copy, Shield, Clock,
  LayoutGrid, Maximize2, MonitorStop,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { toggleMic, toggleCamera, toggleScreenShare, toggleHandRaise, setSelectedMic, setSelectedCamera } from '@/store/slices/mediaSlice';
import { leaveMeeting, toggleRecording, setMeetingActive, fetchMeetingById, endMeetingAsync } from '@/store/slices/meetingSlice';
import { setSidePanel, toggleSettings } from '@/store/slices/uiSlice';
import { setParticipants, setActiveSpeaker, pinParticipant, addParticipant } from '@/store/slices/participantSlice';
import { loadChatHistory, clearChat } from '@/store/slices/chatSlice';
import VideoTile from '@/components/meeting/VideoTile';
import ChatPanel from '@/components/meeting/ChatPanel';
import ParticipantsPanel from '@/components/meeting/ParticipantsPanel';
import SettingsModal from '@/components/meeting/SettingsModal';
import { useMeetingSocket, type WebRTCCallbacks } from '@/hooks/useSocket';
import { useLocalStream, useScreenShare, useRecording, usePeerConnections, useSpeakerDetection } from '@/hooks/useWebRTC';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

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

type ViewMode = 'grid' | 'speaker';

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isMicOn, isCameraOn, isScreenSharing, isHandRaised } = useAppSelector(s => s.media);
  const { isRecording, startTime, connectionStatus, title, meetingId, isHost, currentMeeting } = useAppSelector(s => s.meeting);
  const { sidePanel, isSettingsOpen } = useAppSelector(s => s.ui);
  const { participants, activeSpeakerId, pinnedParticipantId } = useAppSelector(s => s.participants);
  const unreadCount = useAppSelector(s => s.chat.unreadCount);
  const user = useAppSelector(s => s.auth.user);
  const timer = useTimer(startTime);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // ─── WebRTC hooks ───
  const { localStream, acquire, toggleTrack, release } = useLocalStream();
  const { screenStream, startShare, stopShare } = useScreenShare();
  const { isRecording: isLocalRecording, duration: recDuration, startRecording, stopRecording } = useRecording();
  const {
    remoteStreams,
    createPeer,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    replaceTrackForAll,
    addScreenTrack,
    removeScreenTrack,
    removePeer,
    closeAll,
  } = usePeerConnections();

  // Speaker detection on all remote audio streams
  const audioStreams = useMemo(() => {
    const map = new Map<string, MediaStream>();
    remoteStreams.forEach((rs, peerId) => map.set(rs.userId, rs.stream));
    if (localStream && user) map.set(user.id, localStream);
    return map;
  }, [remoteStreams, localStream, user]);
  useSpeakerDetection(audioStreams);

  // ─── WebRTC signaling callbacks ───
  const webrtcCallbacks: WebRTCCallbacks = useMemo(() => ({
    onMeetingJoined: async (data) => {
      // Create peer connections for all existing participants
      if (!localStream || !data.participants) return;
      for (const p of data.participants) {
        if (p.socketId === (globalThis as any).__mySocketId) continue;
        const pc = createPeer(p.socketId, p.userId, localStream, (candidate) => {
          sendIceCandidate(p.socketId, candidate);
        });
        const offer = await createOffer(p.socketId);
        if (offer) sendOffer(p.socketId, offer);
      }
    },
    onParticipantJoined: async (data) => {
      if (!localStream) return;
      // New participant joined — create peer and send offer
      const pc = createPeer(data.socketId, data.userId, localStream, (candidate) => {
        sendIceCandidate(data.socketId, candidate);
      });
      const offer = await createOffer(data.socketId);
      if (offer) sendOffer(data.socketId, offer);
    },
    onParticipantLeft: (data) => {
      removePeer(data.socketId);
    },
    onReceiveOffer: async (data) => {
      if (!localStream) return;
      // Ensure peer exists
      let needsCreate = true;
      try {
        const existing = createPeer(data.from, data.fromUserId, localStream, (candidate) => {
          sendIceCandidate(data.from, candidate);
        });
        needsCreate = false;
      } catch {}
      const answer = await handleOffer(data.from, data.offer);
      if (answer) sendAnswer(data.from, answer);
    },
    onReceiveAnswer: async (data) => {
      await handleAnswer(data.from, data.answer);
    },
    onReceiveIce: async (data) => {
      await handleIceCandidate(data.from, data.candidate);
    },
    onForceMute: () => {
      if (isMicOn) {
        dispatch(toggleMic());
        toggleTrack('audio', false);
      }
    },
    onForceRemove: () => {
      handleLeave();
    },
  }), [localStream, createPeer, createOffer, handleOffer, handleAnswer, handleIceCandidate, removePeer, dispatch, isMicOn]);

  // Socket connection with WebRTC callbacks
  const {
    toggleMicSocket,
    toggleCameraSocket,
    raiseHandSocket,
    startScreenShareSocket,
    stopScreenShareSocket,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    disconnect: disconnectSocket,
  } = useMeetingSocket(id || null, webrtcCallbacks);

  // ─── Initialize meeting ───
  useEffect(() => {
    if (!id) return;

    dispatch(fetchMeetingById(id));
    dispatch(loadChatHistory(id));

    if (!meetingId || meetingId !== id) {
      dispatch(setMeetingActive({
        id,
        title: currentMeeting?.title || 'Meeting',
        isHost: currentMeeting?.hostId?.toString() === user?.id || false,
      }));
    }

    if (user) {
      dispatch(addParticipant({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        isMuted: !isMicOn,
        isCameraOff: !isCameraOn,
        isSpeaking: false,
        isHost: isHost,
        isHandRaised: false,
        networkQuality: 'good',
        isScreenSharing: false,
      }));
    }

    return () => {
      dispatch(clearChat());
    };
  }, [id, dispatch]);

  // Acquire local media on mount
  useEffect(() => {
    acquire(true, true);
    return () => {
      release();
      closeAll();
    };
  }, []);

  // Track socket ID
  useEffect(() => {
    const { getSocket } = require('@/hooks/useSocket');
    const s = getSocket();
    if (s?.id) (globalThis as any).__mySocketId = s.id;
  }, [connectionStatus]);

  // Update meeting title when data loads
  useEffect(() => {
    if (currentMeeting && meetingId === currentMeeting.meetingId) {
      dispatch(setMeetingActive({
        id: currentMeeting.meetingId,
        title: currentMeeting.title,
        isHost: typeof currentMeeting.hostId === 'object'
          ? (currentMeeting.hostId as any)._id === user?.id
          : currentMeeting.hostId === user?.id,
      }));
    }
  }, [currentMeeting]);

  // ─── Control handlers ───
  const handleLeave = useCallback(async () => {
    closeAll();
    release();
    stopShare();
    disconnectSocket();
    dispatch(leaveMeeting());
    navigate('/dashboard');
  }, [dispatch, navigate, disconnectSocket, closeAll, release, stopShare]);

  const handleEndMeeting = useCallback(async () => {
    if (!id) return;
    await dispatch(endMeetingAsync(id));
    closeAll();
    release();
    disconnectSocket();
    dispatch(leaveMeeting());
    navigate('/dashboard');
    toast.info('Meeting ended');
  }, [id, dispatch, navigate, disconnectSocket, closeAll, release]);

  const handleToggleMic = useCallback(() => {
    const newState = !isMicOn;
    dispatch(toggleMic());
    toggleTrack('audio', newState);
    toggleMicSocket(newState);
  }, [dispatch, isMicOn, toggleTrack, toggleMicSocket]);

  const handleToggleCamera = useCallback(() => {
    const newState = !isCameraOn;
    dispatch(toggleCamera());
    toggleTrack('video', newState);
    toggleCameraSocket(newState);
  }, [dispatch, isCameraOn, toggleTrack, toggleCameraSocket]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      const stream = await startShare();
      if (stream) {
        dispatch(toggleScreenShare());
        startScreenShareSocket();
        // Add screen track to all peers
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) addScreenTrack(videoTrack, stream);
      }
    } else {
      stopShare();
      dispatch(toggleScreenShare());
      stopScreenShareSocket();
    }
  }, [dispatch, isScreenSharing, startShare, stopShare, startScreenShareSocket, stopScreenShareSocket, addScreenTrack]);

  const handleToggleHand = useCallback(() => {
    dispatch(toggleHandRaise());
    raiseHandSocket(!isHandRaised);
  }, [dispatch, isHandRaised, raiseHandSocket]);

  const handleToggleRecording = useCallback(() => {
    if (!isLocalRecording) {
      const streams: MediaStream[] = [];
      if (localStream) streams.push(localStream);
      remoteStreams.forEach(rs => streams.push(rs.stream));
      if (screenStream) streams.push(screenStream);
      if (streams.length > 0) {
        startRecording(streams);
        dispatch(toggleRecording());
      }
    } else {
      stopRecording();
      dispatch(toggleRecording());
    }
  }, [isLocalRecording, localStream, remoteStreams, screenStream, startRecording, stopRecording, dispatch]);

  const togglePanel = useCallback((panel: 'chat' | 'participants') => {
    dispatch(setSidePanel(sidePanel === panel ? 'none' : panel));
  }, [dispatch, sidePanel]);

  // ─── Layout logic ───
  const focusedId = pinnedParticipantId || activeSpeakerId;
  const sortedParticipants = useMemo(() => {
    if (viewMode === 'speaker' && focusedId) {
      const focused = participants.find(p => p.id === focusedId);
      const rest = participants.filter(p => p.id !== focusedId);
      return focused ? [focused, ...rest] : participants;
    }
    return participants;
  }, [participants, viewMode, focusedId]);

  const gridClass = useMemo(() => {
    if (viewMode === 'speaker') return '';
    const count = sortedParticipants.length;
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3';
    if (count <= 9) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  }, [sortedParticipants.length, viewMode]);

  const isPanelOpen = sidePanel !== 'none';

  // Get stream for a participant
  const getStream = useCallback((participantId: string): MediaStream | null => {
    if (participantId === user?.id) return localStream;
    for (const [, rs] of remoteStreams) {
      if (rs.userId === participantId) return rs.stream;
    }
    return null;
  }, [user, localStream, remoteStreams]);

  const formatRecDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
          {(isRecording || isLocalRecording) && (
            <div className="flex items-center gap-1.5 text-meet-danger">
              <span className="w-2 h-2 rounded-full bg-meet-danger animate-pulse" />
              <span className="text-xs font-medium">REC {isLocalRecording && formatRecDuration(recDuration)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Shield className={`w-3.5 h-3.5 ${connectionStatus === 'connected' ? 'text-meet-success' : connectionStatus === 'reconnecting' ? 'text-meet-warning' : 'text-meet-danger'}`} />
            <span className="text-xs text-meet-control-fg/60 hidden sm:inline capitalize">{connectionStatus}</span>
          </div>
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(v => v === 'grid' ? 'speaker' : 'grid')}
            className="hidden sm:flex items-center gap-1.5 text-xs text-meet-control-fg/60 hover:text-meet-control-fg transition-colors px-2 py-1 rounded hover:bg-meet-control-fg/10"
            aria-label={viewMode === 'grid' ? 'Speaker view' : 'Grid view'}
            title={viewMode === 'grid' ? 'Speaker view' : 'Grid view'}
          >
            {viewMode === 'grid' ? <Maximize2 className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(meetingId || id || '');
              toast.success('Meeting code copied!');
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
        <div className={`flex-1 p-3 transition-all duration-300 ${isPanelOpen ? 'lg:mr-0' : ''}`}>
          {viewMode === 'speaker' && focusedId ? (
            /* Speaker View */
            <div className="flex flex-col h-full gap-3">
              {/* Main speaker */}
              <div className="flex-1 min-h-0">
                {sortedParticipants[0] && (
                  <VideoTile
                    participant={sortedParticipants[0]}
                    stream={getStream(sortedParticipants[0].id)}
                    isActive
                    isPinned={pinnedParticipantId === sortedParticipants[0].id}
                    onPin={() => dispatch(pinParticipant(pinnedParticipantId === sortedParticipants[0].id ? null : sortedParticipants[0].id))}
                    size="lg"
                    isMirrored={sortedParticipants[0].id === user?.id}
                  />
                )}
              </div>
              {/* Thumbnails */}
              {sortedParticipants.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0" style={{ height: '120px' }}>
                  {sortedParticipants.slice(1).map(p => (
                    <div key={p.id} className="w-[160px] flex-shrink-0 h-full">
                      <VideoTile
                        participant={p}
                        stream={getStream(p.id)}
                        isPinned={pinnedParticipantId === p.id}
                        onPin={() => dispatch(pinParticipant(pinnedParticipantId === p.id ? null : p.id))}
                        size="sm"
                        isMirrored={p.id === user?.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Grid View */
            <div className={`grid ${gridClass} gap-3 h-full auto-rows-fr`}>
              {sortedParticipants.map(p => (
                <VideoTile
                  key={p.id}
                  participant={p}
                  stream={getStream(p.id)}
                  isActive={activeSpeakerId === p.id}
                  isPinned={pinnedParticipantId === p.id}
                  onPin={() => dispatch(pinParticipant(pinnedParticipantId === p.id ? null : p.id))}
                  size={sortedParticipants.length <= 2 ? 'lg' : sortedParticipants.length <= 4 ? 'md' : 'sm'}
                  isMirrored={p.id === user?.id}
                />
              ))}
            </div>
          )}
        </div>

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

      {/* Screen share preview (floating) */}
      {isScreenSharing && screenStream && (
        <div className="absolute bottom-24 right-4 w-48 h-28 rounded-lg overflow-hidden border-2 border-primary shadow-lg z-10">
          <video
            autoPlay
            playsInline
            muted
            ref={(el) => { if (el && el.srcObject !== screenStream) el.srcObject = screenStream; }}
            className="w-full h-full object-contain bg-black"
          />
          <button
            onClick={handleToggleScreenShare}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-meet-danger flex items-center justify-center"
            aria-label="Stop sharing"
          >
            <MonitorStop className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="h-20 flex items-center justify-center px-4 bg-meet-control-bg/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={handleToggleMic} className={isMicOn ? 'meet-control-btn' : 'meet-control-btn-danger'} aria-label={isMicOn ? 'Mute' : 'Unmute'} title={isMicOn ? 'Mute (Ctrl+D)' : 'Unmute (Ctrl+D)'}>
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button onClick={handleToggleCamera} className={isCameraOn ? 'meet-control-btn' : 'meet-control-btn-danger'} aria-label={isCameraOn ? 'Camera off' : 'Camera on'} title={isCameraOn ? 'Camera off (Ctrl+E)' : 'Camera on (Ctrl+E)'}>
            {isCameraOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <button onClick={handleToggleScreenShare} className={isScreenSharing ? 'meet-control-btn-active' : 'meet-control-btn'} aria-label="Share screen" title="Present now">
            <Monitor className="w-5 h-5" />
          </button>
          <button onClick={handleToggleHand} className={isHandRaised ? 'meet-control-btn-active' : 'meet-control-btn'} aria-label="Raise hand" title="Raise hand">
            <Hand className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-meet-control-fg/20 mx-1 hidden sm:block" />

          <button onClick={() => togglePanel('chat')} className={`meet-control-btn relative ${sidePanel === 'chat' ? '!bg-primary' : ''}`} aria-label="Toggle chat" title="Chat">
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && sidePanel !== 'chat' && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-meet-danger text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => togglePanel('participants')} className={`meet-control-btn relative ${sidePanel === 'participants' ? '!bg-primary' : ''}`} aria-label="Toggle participants" title="People">
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-meet-control-bg border border-meet-control-fg/20 text-[10px] font-bold flex items-center justify-center text-meet-control-fg">
              {participants.length}
            </span>
          </button>
          <button onClick={handleToggleRecording} className={`meet-control-btn hidden sm:flex ${isLocalRecording ? '!bg-meet-danger' : ''}`} aria-label={isLocalRecording ? 'Stop recording' : 'Start recording'} title="Record">
            <Disc className="w-5 h-5" />
          </button>
          <button onClick={() => dispatch(toggleSettings())} className="meet-control-btn hidden sm:flex" aria-label="Settings" title="Settings">
            <Settings className="w-5 h-5" />
          </button>
          <button className="meet-control-btn sm:hidden" aria-label="More options">
            <MoreVertical className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-meet-control-fg/20 mx-1 hidden sm:block" />

          {isHost && (
            <button onClick={handleEndMeeting} className="meet-control-btn-danger px-4 hidden sm:flex items-center gap-1.5" aria-label="End meeting" title="End meeting for all">
              <PhoneOff className="w-4 h-4" />
              <span className="text-xs font-medium">End</span>
            </button>
          )}
          <button onClick={handleLeave} className="meet-control-btn-danger px-6" aria-label="Leave meeting" title="Leave call">
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => dispatch(toggleSettings())} />}
    </div>
  );
}
