import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateParticipant, setActiveSpeaker } from '@/store/slices/participantSlice';
import { toast } from 'sonner';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add your TURN server here for production:
    // { urls: 'turn:your-turn-server:3478', username: 'user', credential: 'pass' },
  ],
  iceCandidatePoolSize: 10,
};

export interface RemoteStream {
  peerId: string;
  userId: string;
  stream: MediaStream;
  kind: 'camera' | 'screen';
}

// ─── Local Stream ───
export function useLocalStream() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const { selectedMic, selectedCamera } = useAppSelector(s => s.media);

  const acquire = useCallback(async (audio = true, video = true) => {
    setIsAcquiring(true);
    try {
      // Stop any existing tracks
      streamRef.current?.getTracks().forEach(t => t.stop());

      const constraints: MediaStreamConstraints = {
        audio: audio ? (selectedMic ? { deviceId: { exact: selectedMic } } : {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }) : false,
        video: video ? (selectedCamera ? { deviceId: { exact: selectedCamera } } : {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: 'user',
        }) : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      console.error('[WebRTC] Failed to acquire media:', err.name);
      if (err.name === 'NotAllowedError') {
        toast.error('Camera/microphone permission denied');
      } else if (err.name === 'NotFoundError') {
        toast.error('No camera or microphone found');
      } else {
        toast.error('Failed to access media devices');
      }
      return null;
    } finally {
      setIsAcquiring(false);
    }
  }, [selectedMic, selectedCamera]);

  const toggleTrack = useCallback((kind: 'audio' | 'video', enabled: boolean) => {
    const stream = streamRef.current;
    if (!stream) return;
    const tracks = kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();
    tracks.forEach(t => { t.enabled = enabled; });
  }, []);

  const replaceTrack = useCallback(async (kind: 'audio' | 'video', deviceId: string) => {
    const stream = streamRef.current;
    if (!stream) return;

    const constraints = kind === 'audio'
      ? { audio: { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true } }
      : { video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } };

    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints);
      const newTrack = kind === 'audio' ? newStream.getAudioTracks()[0] : newStream.getVideoTracks()[0];
      const oldTrack = kind === 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

      if (oldTrack) {
        stream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      stream.addTrack(newTrack);
      setLocalStream(new MediaStream(stream.getTracks()));
      return newTrack;
    } catch (err) {
      console.error('[WebRTC] Failed to replace track:', err);
      return null;
    }
  }, []);

  const release = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setLocalStream(null);
  }, []);

  return { localStream, acquire, toggleTrack, replaceTrack, release, isAcquiring };
}

// ─── Screen Share ───
export function useScreenShare() {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: true,
      });

      // Listen for user stopping share via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopShare();
      });

      streamRef.current = stream;
      setScreenStream(stream);
      return stream;
    } catch (err: any) {
      if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
        toast.error('Failed to share screen');
      }
      return null;
    }
  }, []);

  const stopShare = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScreenStream(null);
  }, []);

  return { screenStream, startShare, stopShare };
}

// ─── Recording (MediaRecorder-based client-side) ───
export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);

  const startRecording = useCallback((streams: MediaStream[]) => {
    try {
      // Combine all streams into one
      const ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();

      // Collect video tracks from first stream with video
      let videoTrack: MediaStreamTrack | null = null;

      streams.forEach(stream => {
        stream.getAudioTracks().forEach(track => {
          const src = ctx.createMediaStreamSource(new MediaStream([track]));
          src.connect(dest);
        });
        if (!videoTrack) {
          const vt = stream.getVideoTracks()[0];
          if (vt) videoTrack = vt;
        }
      });

      const combinedTracks = [...dest.stream.getAudioTracks()];
      if (videoTrack) combinedTracks.push(videoTrack);
      const combined = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 2_500_000 });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${new Date().toISOString().slice(0, 19)}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Recording saved');
      };

      recorder.start(1000);
      recorderRef.current = recorder;
      setIsRecording(true);
      setDuration(0);

      timerRef.current = window.setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('[Recording] Failed to start:', err);
      toast.error('Failed to start recording');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    setIsRecording(false);
    clearInterval(timerRef.current);
  }, []);

  return { isRecording, duration, startRecording, stopRecording };
}

// ─── Speaker Detection (AudioContext) ───
export function useSpeakerDetection(streams: Map<string, MediaStream>) {
  const dispatch = useAppDispatch();
  const analysersRef = useRef<Map<string, { analyser: AnalyserNode; ctx: AudioContext }>>(new Map());

  useEffect(() => {
    // Clean up old analysers for removed streams
    analysersRef.current.forEach((val, peerId) => {
      if (!streams.has(peerId)) {
        val.ctx.close();
        analysersRef.current.delete(peerId);
      }
    });

    // Create analysers for new streams
    streams.forEach((stream, peerId) => {
      if (analysersRef.current.has(peerId)) return;
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      try {
        const ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.4;
        src.connect(analyser);
        analysersRef.current.set(peerId, { analyser, ctx });
      } catch {
        // AudioContext may fail in some environments
      }
    });

    const data = new Uint8Array(256);
    let rafId: number;

    const detect = () => {
      let maxVolume = 0;
      let loudest: string | null = null;

      analysersRef.current.forEach((val, peerId) => {
        val.analyser.getByteFrequencyData(data);
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
        const isSpeaking = avg > 15;

        dispatch(updateParticipant({ id: peerId, changes: { isSpeaking } }));

        if (avg > maxVolume && isSpeaking) {
          maxVolume = avg;
          loudest = peerId;
        }
      });

      dispatch(setActiveSpeaker(loudest));
      rafId = requestAnimationFrame(detect);
    };

    if (analysersRef.current.size > 0) {
      rafId = requestAnimationFrame(detect);
    }

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [streams, dispatch]);

  useEffect(() => {
    return () => {
      analysersRef.current.forEach(val => val.ctx.close());
      analysersRef.current.clear();
    };
  }, []);
}

// ─── Peer Connection Manager ───
export function usePeerConnections() {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const createPeer = useCallback((peerId: string, userId: string, localStream: MediaStream | null, onIceCandidate: (candidate: RTCIceCandidate) => void) => {
    // Don't create duplicate connections
    if (peersRef.current.has(peerId)) {
      return peersRef.current.get(peerId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(peerId, pc);

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received track from ${peerId}:`, event.track.kind);
      const stream = event.streams[0] || new MediaStream([event.track]);

      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.set(peerId, { peerId, userId, stream, kind: 'camera' });
        return next;
      });
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state ${peerId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[WebRTC] Connection failed with ${peerId}, attempting restart`);
        pc.restartIce();
      }
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      }
    };

    pc.onnegotiationneeded = () => {
      console.log(`[WebRTC] Negotiation needed for ${peerId}`);
    };

    return pc;
  }, []);

  const createOffer = useCallback(async (peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (!pc) return null;

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      return offer;
    } catch (err) {
      console.error(`[WebRTC] Failed to create offer for ${peerId}:`, err);
      return null;
    }
  }, []);

  const handleOffer = useCallback(async (peerId: string, offer: RTCSessionDescriptionInit) => {
    const pc = peersRef.current.get(peerId);
    if (!pc) return null;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush pending ICE candidates
      const pending = pendingCandidatesRef.current.get(peerId) || [];
      for (const candidate of pending) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current.delete(peerId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return answer;
    } catch (err) {
      console.error(`[WebRTC] Failed to handle offer from ${peerId}:`, err);
      return null;
    }
  }, []);

  const handleAnswer = useCallback(async (peerId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peersRef.current.get(peerId);
    if (!pc) return;

    try {
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Flush pending ICE candidates
        const pending = pendingCandidatesRef.current.get(peerId) || [];
        for (const candidate of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current.delete(peerId);
      }
    } catch (err) {
      console.error(`[WebRTC] Failed to handle answer from ${peerId}:`, err);
    }
  }, []);

  const handleIceCandidate = useCallback(async (peerId: string, candidate: RTCIceCandidateInit) => {
    const pc = peersRef.current.get(peerId);
    if (!pc) return;

    try {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Queue candidate until remote description is set
        if (!pendingCandidatesRef.current.has(peerId)) {
          pendingCandidatesRef.current.set(peerId, []);
        }
        pendingCandidatesRef.current.get(peerId)!.push(candidate);
      }
    } catch (err) {
      console.error(`[WebRTC] Failed to add ICE candidate for ${peerId}:`, err);
    }
  }, []);

  const replaceTrackForAll = useCallback((oldTrack: MediaStreamTrack | null, newTrack: MediaStreamTrack) => {
    peersRef.current.forEach((pc) => {
      const sender = pc.getSenders().find(s => s.track?.kind === newTrack.kind);
      if (sender) {
        sender.replaceTrack(newTrack);
      } else {
        // If no sender exists for this kind, add the track
        pc.addTrack(newTrack);
      }
    });
  }, []);

  const addScreenTrack = useCallback((track: MediaStreamTrack, stream: MediaStream) => {
    peersRef.current.forEach((pc) => {
      pc.addTrack(track, stream);
    });
  }, []);

  const removeScreenTrack = useCallback((track: MediaStreamTrack) => {
    peersRef.current.forEach((pc) => {
      const sender = pc.getSenders().find(s => s.track === track);
      if (sender) pc.removeTrack(sender);
    });
  }, []);

  const removePeer = useCallback((peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      pc.close();
      peersRef.current.delete(peerId);
    }
    setRemoteStreams(prev => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
    pendingCandidatesRef.current.delete(peerId);
  }, []);

  const closeAll = useCallback(() => {
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();
    setRemoteStreams(new Map());
  }, []);

  return {
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
    peersRef,
  };
}
