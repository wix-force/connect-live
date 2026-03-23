import { memo } from 'react';
import { Mic, MicOff, Wifi, WifiOff, Hand, Pin } from 'lucide-react';
import type { Participant } from '@/store/slices/participantSlice';

interface VideoTileProps {
  participant: Participant;
  isActive?: boolean;
  isPinned?: boolean;
  onPin?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const SpeakingIndicator = () => (
  <div className="flex items-end gap-0.5 h-4">
    {[0, 1, 2].map(i => (
      <div
        key={i}
        className="w-0.5 bg-meet-success rounded-full animate-speaking"
        style={{ animationDelay: `${i * 0.15}s`, height: '100%' }}
      />
    ))}
  </div>
);

const NetworkBadge = ({ quality }: { quality: string }) => {
  const color = quality === 'good' ? 'text-meet-success' : quality === 'fair' ? 'text-meet-warning' : 'text-meet-danger';
  return quality === 'poor' ? <WifiOff className={`w-3.5 h-3.5 ${color}`} /> : <Wifi className={`w-3.5 h-3.5 ${color}`} />;
};

const VideoTile = memo(function VideoTile({ participant, isActive, isPinned, onPin, size = 'md' }: VideoTileProps) {
  const avatarSize = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'sm' ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-lg';

  return (
    <div
      className={`meet-tile relative group flex items-center justify-center transition-all duration-300 ${
        isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-meet-video-bg' : ''
      }`}
      role="region"
      aria-label={`${participant.name}'s video`}
    >
      {/* Video / Avatar fallback */}
      {participant.isCameraOff ? (
        <div className="w-full h-full flex items-center justify-center bg-meet-tile-bg">
          <div className={`rounded-full bg-primary/20 flex items-center justify-center ${avatarSize}`}>
            <span className="font-semibold text-primary">
              {participant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-meet-tile-bg flex items-center justify-center">
          <div className={`rounded-full bg-primary/30 flex items-center justify-center ${avatarSize}`}>
            <span className="font-semibold text-primary">
              {participant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
        </div>
      )}

      {/* Top indicators */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        {participant.isHandRaised && (
          <div className="w-7 h-7 rounded-full bg-meet-warning/20 flex items-center justify-center">
            <Hand className="w-4 h-4 text-meet-warning" />
          </div>
        )}
        <NetworkBadge quality={participant.networkQuality} />
      </div>

      {/* Pin button on hover */}
      {onPin && (
        <button
          onClick={onPin}
          className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-opacity ${
            isPinned ? 'bg-primary opacity-100' : 'bg-meet-control-bg opacity-0 group-hover:opacity-100'
          }`}
          aria-label={isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-primary-foreground' : 'text-meet-control-fg'}`} />
        </button>
      )}

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary-foreground truncate max-w-[120px]">
            {participant.name}
          </span>
          {participant.isHost && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/80 text-primary-foreground font-medium">
              Host
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {participant.isSpeaking && <SpeakingIndicator />}
          {participant.isMuted ? (
            <MicOff className="w-4 h-4 text-meet-danger" />
          ) : (
            <Mic className="w-4 h-4 text-primary-foreground" />
          )}
        </div>
      </div>
    </div>
  );
});

export default VideoTile;
