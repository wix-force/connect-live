import { useCallback, useEffect, useRef } from 'react';

// Socket.IO ready hook - connects when backend is available
export function useSocket() {
  const socketRef = useRef<any>(null);

  const connect = useCallback((_url: string) => {
    // Ready for Socket.IO integration
    // socketRef.current = io(url);
    console.log('[Socket] Ready to connect');
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
    console.log('[Socket] Emit:', event, data);
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  return { connect, emit, on, disconnect, socket: socketRef.current };
}

// Meeting events hook
export function useMeetingEvents() {
  const { emit, on } = useSocket();

  const joinRoom = useCallback((meetingId: string) => {
    emit('meeting:join', { meetingId });
  }, [emit]);

  const leaveRoom = useCallback((meetingId: string) => {
    emit('meeting:leave', { meetingId });
  }, [emit]);

  const onParticipantJoined = useCallback((cb: (data: any) => void) => {
    on('meeting:participant-joined', cb);
  }, [on]);

  const onParticipantLeft = useCallback((cb: (data: any) => void) => {
    on('meeting:participant-left', cb);
  }, [on]);

  return { joinRoom, leaveRoom, onParticipantJoined, onParticipantLeft };
}

// Chat events hook
export function useChatEvents() {
  const { emit, on } = useSocket();

  const sendMessage = useCallback((meetingId: string, message: string) => {
    emit('chat:message', { meetingId, message, timestamp: Date.now() });
  }, [emit]);

  const onMessage = useCallback((cb: (data: any) => void) => {
    on('chat:message', cb);
  }, [on]);

  const sendTyping = useCallback((meetingId: string) => {
    emit('chat:typing', { meetingId });
  }, [emit]);

  return { sendMessage, onMessage, sendTyping };
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
