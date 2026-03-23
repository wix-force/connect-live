import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Video, Mic, MicOff, VideoOff, Monitor, Settings, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleMic, toggleCamera } from '@/store/slices/mediaSlice';
import { joinMeetingAsync, fetchMeetingById } from '@/store/slices/meetingSlice';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function JoinMeetingPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isMicOn, isCameraOn } = useAppSelector(s => s.media);
  const user = useAppSelector(s => s.auth.user);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [meetingCode, setMeetingCode] = useState(code || '');
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isNewMeeting] = useState(!code && window.location.pathname === '/meeting/new');

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    if (isCameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          currentStream = s;
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {});
    } else {
      stream?.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    return () => { currentStream?.getTracks().forEach(t => t.stop()); };
  }, [isCameraOn]);

  const handleJoin = async () => {
    if (!meetingCode && !isNewMeeting) {
      toast.error('Please enter a meeting code');
      return;
    }

    setIsJoining(true);
    try {
      if (isNewMeeting) {
        // Creating a new meeting — handled by dashboard, redirect there
        navigate('/dashboard');
        return;
      }

      const result = await dispatch(joinMeetingAsync({ meetingId: meetingCode, password: password || undefined }));
      if (joinMeetingAsync.fulfilled.match(result)) {
        navigate(`/meeting/${meetingCode}`);
      } else {
        toast.error(result.payload as string || 'Failed to join meeting');
      }
    } catch {
      toast.error('Failed to join meeting');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Ready to join?</h1>
          <p className="text-muted-foreground mt-1">Check your audio and video before joining</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Preview */}
          <div className="lg:col-span-3">
            <div className="meet-tile aspect-video relative rounded-2xl overflow-hidden">
              {isCameraOn && stream ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-meet-video-bg">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">{user?.name?.[0] || 'D'}</span>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={() => dispatch(toggleMic())}
                  className={isMicOn ? 'meet-control-btn' : 'meet-control-btn-danger'}
                  aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => dispatch(toggleCamera())}
                  className={isCameraOn ? 'meet-control-btn' : 'meet-control-btn-danger'}
                  aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Join Panel */}
          <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Meeting Details</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Meeting Code</label>
                  <input
                    value={meetingCode}
                    onChange={e => setMeetingCode(e.target.value)}
                    placeholder="Enter meeting code"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Password (optional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Meeting password"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {['Microphone', 'Camera'].map(d => (
                  <div key={d}>
                    <label className="text-sm text-muted-foreground mb-1 block">{d}</label>
                    <button className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground flex items-center justify-between hover:bg-accent transition-colors">
                      <span className="flex items-center gap-2">
                        {d === 'Microphone' ? <Mic className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                        Default {d}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>

              <Button onClick={handleJoin} className="w-full h-11 rounded-lg mt-2" size="lg" disabled={isJoining}>
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isJoining ? 'Joining...' : 'Join Now'}
              </Button>
            </div>

            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
              <Settings className="w-4 h-4" /> More settings
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
