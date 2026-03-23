import { useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/store';
import { setConnectionStatus } from '@/store/slices/meetingSlice';
import { addParticipant, removeParticipant, updateParticipant, setActiveSpeaker } from '@/store/slices/participantSlice';
import { addMessage, addTypingUser, removeTypingUser } from '@/store/slices/chatSlice';
import { toast } from 'sonner';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

let globalSocket: Socket | null = null;

export function getSocket(): Socket | null {
  return globalSocket;
}

export function useSocket() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (globalSocket?.connected) return globalSocket;
    if (!user) return null;

    const socket = io(SOCKET_URL, {
      auth: { userId: user.id, name: user.name },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      dispatch(setConnectionStatus('connected'));
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      dispatch(setConnectionStatus('disconnected'));
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      dispatch(setConnectionStatus('disconnected'));
    });

    socket.io.on('reconnect_attempt', () => {
      dispatch(setConnectionStatus('reconnecting'));
    });

    socket.io.on('reconnect', () => {
      dispatch(setConnectionStatus('connected'));
      toast.success('Reconnected to meeting');
    });

    globalSocket = socket;
    socketRef.current = socket;
    return socket;
  }, [user, dispatch]);

  const disconnect = useCallback(() => {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
      socketRef.current = null;
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (globalSocket?.connected) {
      globalSocket.emit(event, data);
    } else {
      console.warn('[Socket] Not connected, cannot emit:', event);
    }
  }, []);

  return { connect, disconnect, emit, socket: globalSocket };
}

// Meeting-specific socket events
export function useMeetingSocket(meetingId: string | null) {
  const dispatch = useAppDispatch();
  const { connect, emit, disconnect } = useSocket();
  const user = useAppSelector(s => s.auth.user);
  const isHost = useAppSelector(s => s.meeting.isHost);

  useEffect(() => {
    if (!meetingId || !user) return;

    const socket = connect();
    if (!socket) return;

    // Wait for connection then join room
    const joinRoom = () => {
      socket.emit('join-meeting', {
        meetingId,
        role: isHost ? 'host' : 'guest',
      });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }

    // Meeting events
    socket.on('meeting-joined', (data: any) => {
      console.log('[Socket] Joined meeting with participants:', data.participants?.length);
      dispatch(setConnectionStatus('connected'));
    });

    socket.on('participant-joined', (data: any) => {
      dispatch(addParticipant({
        id: data.userId,
        name: data.name,
        isMuted: false,
        isCameraOff: false,
        isSpeaking: false,
        isHost: data.role === 'host',
        isHandRaised: false,
        networkQuality: 'good',
        isScreenSharing: false,
      }));
      toast.info(`${data.name} joined the meeting`);
    });

    socket.on('participant-left', (data: any) => {
      dispatch(removeParticipant(data.userId));
      toast.info(`${data.name} left the meeting`);
    });

    socket.on('meeting-updated', (data: any) => {
      switch (data.type) {
        case 'mic-toggle':
          dispatch(updateParticipant({ id: data.userId, changes: { isMuted: !data.status } }));
          break;
        case 'camera-toggle':
          dispatch(updateParticipant({ id: data.userId, changes: { isCameraOff: !data.status } }));
          break;
        case 'hand-raise':
          dispatch(updateParticipant({ id: data.userId, changes: { isHandRaised: data.status } }));
          break;
        case 'screen-share-start':
          dispatch(updateParticipant({ id: data.userId, changes: { isScreenSharing: true } }));
          break;
        case 'screen-share-stop':
          dispatch(updateParticipant({ id: data.userId, changes: { isScreenSharing: false } }));
          break;
      }
    });

    socket.on('meeting-ended', (data: any) => {
      toast.info(`Meeting ended by ${data.endedBy}`);
    });

    // Chat events
    socket.on('chat-received', (data: any) => {
      if (data.senderId !== user.id) {
        dispatch(addMessage({
          id: data.id,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.message,
          timestamp: new Date(data.timestamp).getTime(),
          type: data.type === 'system' ? 'system' : 'text',
        }));
      }
    });

    socket.on('chat-typing', (data: any) => {
      dispatch(addTypingUser(data.name));
      setTimeout(() => dispatch(removeTypingUser(data.name)), 3000);
    });

    // WebRTC signaling
    socket.on('receive-offer', (data: any) => {
      console.log('[WebRTC] Received offer from:', data.fromUserId);
      // WebRTC integration point: handle incoming offer
    });

    socket.on('receive-answer', (data: any) => {
      console.log('[WebRTC] Received answer from:', data.fromUserId);
      // WebRTC integration point: handle incoming answer
    });

    socket.on('receive-ice', (data: any) => {
      console.log('[WebRTC] Received ICE candidate from:', data.fromUserId);
      // WebRTC integration point: handle ICE candidate
    });

    // Host controls
    socket.on('force-mute', (data: any) => {
      toast.warning(`You were muted by ${data.by}`);
    });

    socket.on('force-remove', (data: any) => {
      toast.error(`You were removed from the meeting by ${data.by}`);
    });

    return () => {
      socket.emit('leave-meeting', { meetingId });
      socket.off('meeting-joined');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('meeting-updated');
      socket.off('meeting-ended');
      socket.off('chat-received');
      socket.off('chat-typing');
      socket.off('receive-offer');
      socket.off('receive-answer');
      socket.off('receive-ice');
      socket.off('force-mute');
      socket.off('force-remove');
    };
  }, [meetingId, user, isHost, connect, dispatch]);

  // Emit helpers
  const sendChatMessage = useCallback((message: string) => {
    if (!meetingId) return;
    emit('chat-message', { meetingId, message });
  }, [meetingId, emit]);

  const toggleMicSocket = useCallback((status: boolean) => {
    if (!meetingId) return;
    emit('toggle-mic', { meetingId, status });
  }, [meetingId, emit]);

  const toggleCameraSocket = useCallback((status: boolean) => {
    if (!meetingId) return;
    emit('toggle-camera', { meetingId, status });
  }, [meetingId, emit]);

  const raiseHandSocket = useCallback((status: boolean) => {
    if (!meetingId) return;
    emit('raise-hand', { meetingId, status });
  }, [meetingId, emit]);

  const startScreenShareSocket = useCallback(() => {
    if (!meetingId) return;
    emit('start-screen-share', { meetingId });
  }, [meetingId, emit]);

  const stopScreenShareSocket = useCallback(() => {
    if (!meetingId) return;
    emit('stop-screen-share', { meetingId });
  }, [meetingId, emit]);

  const sendTyping = useCallback(() => {
    if (!meetingId) return;
    emit('chat-typing', { meetingId });
  }, [meetingId, emit]);

  // WebRTC signaling helpers
  const sendOffer = useCallback((to: string, offer: any) => {
    emit('send-offer', { to, offer, meetingId });
  }, [meetingId, emit]);

  const sendAnswer = useCallback((to: string, answer: any) => {
    emit('send-answer', { to, answer, meetingId });
  }, [meetingId, emit]);

  const sendIceCandidate = useCallback((to: string, candidate: any) => {
    emit('ice-candidate', { to, candidate, meetingId });
  }, [meetingId, emit]);

  return {
    sendChatMessage,
    toggleMicSocket,
    toggleCameraSocket,
    raiseHandSocket,
    startScreenShareSocket,
    stopScreenShareSocket,
    sendTyping,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    disconnect,
  };
}

// Media devices hook
export function useMediaDevices() {
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.map(d => ({ id: d.deviceId, label: d.label || `${d.kind} ${d.deviceId.slice(0, 5)}`, kind: d.kind }));
    } catch {
      return [];
    }
  }, []);

  const getUserMedia = useCallback(async (constraints: MediaStreamConstraints) => {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
      return null;
    }
  }, []);

  return { getDevices, getUserMedia };
}

// Theme hook
export function useTheme() {
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const theme = saved || 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const toggle = useCallback(() => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    return isDark ? 'dark' : 'light';
  }, []);

  return { toggle };
}
